// SPDX-License-Identifier: GPL-3.0-only
package fr.eleprettre.teslabridge;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.provider.Settings;
import android.graphics.Color;
import android.widget.*;
import android.view.View;

public final class WelcomeActivity extends Activity {
    private LinearLayout body;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(Color.rgb(17, 23, 35));
        body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        int pad = (int)(24 * getResources().getDisplayMetrics().density);
        body.setPadding(pad, pad * 2, pad, pad);
        scroll.addView(body);
        setContentView(scroll);
        text("Passerelle Tesla", 30);
        text("Prototype 0.1 · Android Auto", 18);
        text("Première configuration et essais : voiture stationnée. Compatibilité Android 17 / One UI 9 et Tesla à vérifier.", 17);
        text("1 · Préparer Android Auto", 22);
        text("Ouvre ses réglages, termine sa configuration, active le mode développeur en appuyant plusieurs fois sur la version, puis choisis « Start head unit server » dans le menu.", 17);
        button("Réglages Android Auto", v -> openAuto());
        text("2 · Connecter la voiture", 22);
        text("Active le partage de connexion Wi-Fi Samsung et connecte la Tesla à ce réseau. Sélectionne le Samsung comme source audio Bluetooth.", 17);
        button("Ouvrir les paramètres réseau", v -> openSettings());
        text("3 · Lancer la projection", 22);
        text("Dans le moteur : démarre le service Web puis Input sources → Android Auto → connexion locale / same-phone. Ouvre ensuite l'adresse indiquée dans le navigateur Tesla et termine l'appairage.", 17);
        text("Si l'adresse privée est refusée, le moteur propose Settings → Tesla compatibility → No-root VPN (experimental). Ce mode doit être autorisé manuellement et sa compatibilité reste à tester.", 17);
        button("Ouvrir le moteur de projection", v -> {
            Intent i = new Intent();
            i.setClassName(this, "com.shilapi.xcertplay.DiPlayActivity");
            startActivity(i);
        });
        text("4 · Vérifier Waze et Deezer", 22);
        text("À l'arrêt : vérifie l'image, le tactile, puis la musique et le guidage vocal. Le moteur joue le son sur le téléphone ; la sortie Bluetooth Tesla doit être testée. Les appels et la reconnexion automatique ne sont pas validés.", 17);
        text("Arrête la session et le service Web dans le moteur après l'essai. Désactive le VPN d'essai et le hotspot si utilisés.", 17);
        text("Basé sur WheelPlay (GPL-3.0). Le moteur conserve ses réglages en anglais. Aucun compte Tesla ni mot de passe n'est demandé par cet accueil.", 14);
    }
    private void text(String value, int size) {
        TextView t = new TextView(this);
        t.setText(value); t.setTextSize(size);
        t.setTextColor(Color.rgb(235, 240, 250));
        t.setPadding(0, 12, 0, 12);
        body.addView(t);
    }
    private void button(String title, View.OnClickListener action) {
        Button b = new Button(this); b.setText(title);
        b.setAllCaps(false); b.setOnClickListener(action);
        body.addView(b);
    }
    private void openAuto() {
        Intent intent = new Intent("com.google.android.projection.gearhead.settings.ANDROID_AUTO_SETTINGS");
        intent.setPackage("com.google.android.projection.gearhead");
        try { startActivity(intent); }
        catch (android.content.ActivityNotFoundException | SecurityException e) {
            try { startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                android.net.Uri.parse("package:com.google.android.projection.gearhead"))); }
            catch (android.content.ActivityNotFoundException | SecurityException ignored) {
                Toast.makeText(this, "Ouvre Android Auto depuis les paramètres du Samsung.", Toast.LENGTH_LONG).show();
            }
        }
    }
    private void openSettings() {
        try { startActivity(new Intent(Settings.ACTION_WIRELESS_SETTINGS)); }
        catch (android.content.ActivityNotFoundException e) {
            startActivity(new Intent(Settings.ACTION_SETTINGS));
        }
    }
}
