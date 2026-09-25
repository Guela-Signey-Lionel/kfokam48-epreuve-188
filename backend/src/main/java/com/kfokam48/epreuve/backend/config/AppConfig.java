package com.kfokam48.epreuve.backend.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(PresenceProperties.class)
public class AppConfig {
}
