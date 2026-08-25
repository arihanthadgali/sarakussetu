package com.sarakusetu.backend.authentication.otp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sarakusetu.backend.authentication.otp.delivery.OtpDelivery;
import com.sarakusetu.backend.customer.Customer;
import com.sarakusetu.backend.customer.CustomerRepository;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:otp-authentication;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.flyway.url=jdbc:h2:mem:otp-authentication;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.flyway.user=sa",
        "spring.flyway.password=",
        "app.jwt.secret=c2FyYWt1c2V0dS10ZXN0LWp3dC1zZWNyZXQta2V5MzI="
})
@AutoConfigureMockMvc
class OtpAuthenticationControllerTest {

    private static final String PHONE_NUMBER = "+919876543210";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    @Autowired
    private JwtEncoder jwtEncoder;

    @MockitoBean
    private OtpDelivery otpDelivery;

    @BeforeEach
    void cleanDatabase() {
        otpVerificationRepository.deleteAll();
        customerRepository.deleteAll();
        reset(otpDelivery);
    }

    @Test
    void requestsOtpForNewCustomer() throws Exception {
        String otp = requestOtp(PHONE_NUMBER);

        assertThat(otp).matches("\\d{6}");
        assertThat(customerRepository.findByPhoneNumber(PHONE_NUMBER)).isPresent();
        assertThat(otpVerificationRepository.findAll()).hasSize(1);
    }

    @Test
    void requestsOtpForExistingCustomerWithoutCreatingDuplicate() throws Exception {
        Customer customer = customerRepository.saveAndFlush(new Customer(PHONE_NUMBER));

        requestOtp(PHONE_NUMBER);

        assertThat(customerRepository.count()).isEqualTo(1);
        assertThat(otpVerificationRepository.findAll().get(0).getCustomer().getId()).isEqualTo(customer.getId());
    }

    @Test
    void persistsOnlyBcryptHashOfOtp() throws Exception {
        String otp = requestOtp(PHONE_NUMBER);

        OtpVerification verification = otpVerificationRepository.findAll().get(0);
        assertThat(verification.getOtpHash()).isNotEqualTo(otp);
        assertThat(verification.getOtpHash()).startsWith("$2");
        assertThat(verification.getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void verifiesCorrectOtpSuccessfully() throws Exception {
        String otp = requestOtp(PHONE_NUMBER);

        verifyOtp(PHONE_NUMBER, otp)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verified").value(true))
                .andExpect(jsonPath("$.accessToken").isNotEmpty());

        assertThat(otpVerificationRepository.findAll().get(0).isVerified()).isTrue();
    }

    @Test
    void rejectsInvalidOtpAndRecordsAttempt() throws Exception {
        String otp = requestOtp(PHONE_NUMBER);

        verifyOtp(PHONE_NUMBER, aDifferentOtp(otp))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid OTP."));

        assertThat(otpVerificationRepository.findAll().get(0).getAttemptCount()).isEqualTo(1);
    }

    @Test
    void rejectsExpiredOtp() throws Exception {
        String otp = requestOtp(PHONE_NUMBER);
        OtpVerification verification = otpVerificationRepository.findAll().get(0);
        verification.expireAt(Instant.now().minusSeconds(1));
        otpVerificationRepository.saveAndFlush(verification);

        verifyOtp(PHONE_NUMBER, otp)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("OTP is expired or unavailable."));
    }

    @Test
    void blocksVerificationAfterFiveAttempts() throws Exception {
        String otp = requestOtp(PHONE_NUMBER);
        String invalidOtp = aDifferentOtp(otp);

        for (int attempt = 1; attempt < 5; attempt++) {
            verifyOtp(PHONE_NUMBER, invalidOtp).andExpect(status().isBadRequest());
        }
        verifyOtp(PHONE_NUMBER, invalidOtp).andExpect(status().isTooManyRequests());
        verifyOtp(PHONE_NUMBER, otp).andExpect(status().isTooManyRequests());

        assertThat(otpVerificationRepository.findAll().get(0).getAttemptCount()).isEqualTo(5);
    }

    @Test
    void doesNotAllowOtpReuseAfterVerification() throws Exception {
        String otp = requestOtp(PHONE_NUMBER);

        verifyOtp(PHONE_NUMBER, otp).andExpect(status().isOk());
        verifyOtp(PHONE_NUMBER, otp).andExpect(status().isBadRequest());
    }

    @Test
    void invalidatesPreviousOtpWhenRequestingNewOtp() throws Exception {
        String firstOtp = requestOtp(PHONE_NUMBER);
        String secondOtp = requestOtp(PHONE_NUMBER);

        verifyOtp(PHONE_NUMBER, firstOtp).andExpect(status().isBadRequest());
        verifyOtp(PHONE_NUMBER, secondOtp).andExpect(status().isOk());

        List<OtpVerification> verifications = otpVerificationRepository.findAll();
        assertThat(verifications).hasSize(2);
        assertThat(verifications.stream().filter(verification -> verification.isVerified()).count()).isEqualTo(1);
    }

    @Test
    void validAccessTokenCanAccessAuthenticatedCustomer() throws Exception {
        String otp = requestOtp(PHONE_NUMBER);
        String accessToken = verifyOtpAndGetAccessToken(PHONE_NUMBER, otp);

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phoneNumber").value(PHONE_NUMBER))
                .andExpect(jsonPath("$.id").isNumber());
    }

    @Test
    void rejectsMissingAccessTokenForProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsInvalidAccessTokenForProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsExpiredAccessTokenForProtectedEndpoint() throws Exception {
        Instant now = Instant.now();
        String expiredToken = jwtEncoder.encode(JwtEncoderParameters.from(
                        JwsHeader.with(MacAlgorithm.HS256).build(),
                        JwtClaimsSet.builder()
                                .subject("1")
                                .issuedAt(now.minusSeconds(120))
                                .expiresAt(now.minusSeconds(60))
                                .build()))
                .getTokenValue();

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void keepsHealthEndpointPublic() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    private String requestOtp(String phoneNumber) throws Exception {
        mockMvc.perform(post("/api/auth/otp/request")
                        .contentType("application/json")
                        .content("{\"phoneNumber\":\"" + phoneNumber + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("OTP requested."))
                .andExpect(jsonPath("$.expiresAt").exists());

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(otpDelivery, atLeastOnce()).deliver(anyString(), otpCaptor.capture());
        List<String> generatedOtps = otpCaptor.getAllValues();
        return generatedOtps.get(generatedOtps.size() - 1);
    }

    private org.springframework.test.web.servlet.ResultActions verifyOtp(String phoneNumber, String otp) throws Exception {
        return mockMvc.perform(post("/api/auth/otp/verify")
                .contentType("application/json")
                .content("{\"phoneNumber\":\"" + phoneNumber + "\",\"otp\":\"" + otp + "\"}"));
    }

    private String verifyOtpAndGetAccessToken(String phoneNumber, String otp) throws Exception {
        MvcResult result = verifyOtp(phoneNumber, otp)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();
        return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private String aDifferentOtp(String otp) {
        return "000000".equals(otp) ? "000001" : "000000";
    }
}
