# ============================================================
# ProGuard / R8 rules — NTRSL AI (com.ntrsl.ai)
# ============================================================
# Regras necessárias para que o app Capacitor funcione
# corretamente com minifyEnabled true e shrinkResources true.
# ============================================================

# ── Preservar informações de debug (stack traces legíveis no Play Console) ──
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Capacitor Core ──────────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep @com.getcapacitor.annotation.Permission class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
    @com.getcapacitor.PluginMethod <methods>;
}

# ── WebView / JavaScript Bridge ─────────────────────────────────────────────
# Necessário para que o React rodando no WebView consiga chamar o Java/Kotlin
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# ── AndroidX ────────────────────────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── Splash Screen (androidx.core:core-splashscreen) ─────────────────────────
-keep class androidx.core.splashscreen.** { *; }

# ── Push Notifications (Firebase / FCM) ─────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Capacitor Biometric Auth (@aparajita/capacitor-biometric-auth) ──────────
-keep class com.aparajita.capacitor.biometricauth.** { *; }

# ── Capacitor SQLite (@capacitor-community/sqlite) ──────────────────────────
-keep class com.getcapacitor.community.database.sqlite.** { *; }

# ── Capacitor Secure Storage (@aparajita/capacitor-secure-storage) ──────────
-keep class com.aparajita.capacitor.securestorage.** { *; }

# ── Capacitor Plugins oficiais ───────────────────────────────────────────────
-keep class com.capacitorjs.plugins.** { *; }

# ── Kotlin (se houver código Kotlin embutido pelos plugins) ─────────────────
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ── Gson / JSON (serialização se usada pelos plugins) ───────────────────────
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# ── Suprimir warnings de bibliotecas de terceiros ───────────────────────────
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
-dontwarn javax.annotation.**
