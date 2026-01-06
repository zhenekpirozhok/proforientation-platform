package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.model.User;
import com.diploma.proforientation.repository.UserRepository;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import static com.diploma.proforientation.util.Constants.EMPTY_STRING;

@Service
public class OAuth2UserService extends DefaultOAuth2UserService {
    private static final String EMAIL_ATTRIBUTE = "email";
    private static final String NAME_ATTRIBUTE = "name";

    private final UserRepository userRepository;

    public OAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest)
            throws OAuth2AuthenticationException {

        OAuth2User oauthUser = super.loadUser(userRequest);

        String email = oauthUser.getAttribute(EMAIL_ATTRIBUTE);

        userRepository.findByEmail(email)
                .ifPresentOrElse(
                        u -> {},
                        () -> {
                            User newUser = new User();
                            newUser.setEmail(email);
                            newUser.setDisplayName(oauthUser.getAttribute(NAME_ATTRIBUTE));
                            newUser.setPasswordHash(EMPTY_STRING);
                            userRepository.save(newUser);
                        }
                );

        return oauthUser;
    }

}