package com.kfokam48.epreuve.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.presence")
public class PresenceProperties {

    /** RG1 (Q2) : le code de présence expire 15 minutes après l'ouverture de la session. */
    private int dureeValiditeCodeMinutes = 15;

    /** RG (Q4) : nombre d'échecs avant blocage. */
    private int maxTentativesEchouees = 5;

    /** RG (Q4) : durée du blocage après trop d'échecs. */
    private int dureeBlocageMinutes = 2;

    public int getDureeValiditeCodeMinutes() {
        return dureeValiditeCodeMinutes;
    }

    public void setDureeValiditeCodeMinutes(int dureeValiditeCodeMinutes) {
        this.dureeValiditeCodeMinutes = dureeValiditeCodeMinutes;
    }

    public int getMaxTentativesEchouees() {
        return maxTentativesEchouees;
    }

    public void setMaxTentativesEchouees(int maxTentativesEchouees) {
        this.maxTentativesEchouees = maxTentativesEchouees;
    }

    public int getDureeBlocageMinutes() {
        return dureeBlocageMinutes;
    }

    public void setDureeBlocageMinutes(int dureeBlocageMinutes) {
        this.dureeBlocageMinutes = dureeBlocageMinutes;
    }
}
