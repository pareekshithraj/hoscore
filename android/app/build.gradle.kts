plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.compose.compiler)
  alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.example.hoscore"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.example.hoscore"
        minSdk = 26
        targetSdk = 36
        versionCode = 3
        versionName = "3.0"

        buildConfigField("String", "PROD_API_BASE", "\"https://api.hoscore.in/api/\"")
        buildConfigField("String", "PROD_WS_URL", "\"wss://api.hoscore.in/ws\"")
        buildConfigField("String", "DEV_API_BASE", "\"http://10.0.2.2:5000/api/\"")
        buildConfigField("String", "DEV_WS_URL", "\"ws://10.0.2.2:5000/ws\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
      compose = true
      aidl = false
      buildConfig = true
      shaders = false
    }

    packaging {
      resources {
        excludes += "/META-INF/{AL2.0,LGPL2.1}"
      }
    }
}

kotlin {
    jvmToolchain(17)
}

dependencies {
  val composeBom = platform(libs.androidx.compose.bom)
  implementation(composeBom)
  androidTestImplementation(composeBom)

  // Core Android dependencies
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.lifecycle.runtime.ktx)
  implementation(libs.androidx.activity.compose)

  // Arch Components
  implementation(libs.androidx.lifecycle.runtime.compose)
  implementation(libs.androidx.lifecycle.viewmodel.compose)

  // Compose
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.ui.tooling.preview)
  implementation(libs.androidx.compose.material3)
  // Tooling
  debugImplementation(libs.androidx.compose.ui.tooling)
  // Instrumented tests
  androidTestImplementation(libs.androidx.compose.ui.test.junit4)
  debugImplementation(libs.androidx.compose.ui.test.manifest)

  // Local tests: jUnit, coroutines, Android runner
  testImplementation(libs.junit)
  testImplementation(libs.kotlinx.coroutines.test)

  // Instrumented tests: jUnit rules and runners
  androidTestImplementation(libs.androidx.test.core)
  androidTestImplementation(libs.androidx.test.ext.junit)
  androidTestImplementation(libs.androidx.test.runner)
  androidTestImplementation(libs.androidx.test.espresso.core)

  // Navigation
  implementation(libs.androidx.navigation3.ui)
  implementation(libs.androidx.navigation3.runtime)
  implementation(libs.androidx.lifecycle.viewmodel.navigation3)
  implementation(libs.coil.compose)
  implementation(libs.zxing.android.embedded)
  implementation(libs.zxing.core)
  
  // Compose Icons
  implementation("androidx.compose.material:material-icons-core")

  // Networking
  implementation("com.squareup.okhttp3:okhttp:4.12.0")
  implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
  implementation(libs.retrofit)
  implementation(libs.retrofit.kotlinx.serialization.converter)
  implementation(libs.kotlinx.serialization.json)

  // Image loading
  implementation(libs.coil.compose)

  // Extended Material icons
  implementation("androidx.compose.material:material-icons-extended")

  // Encrypted Storage (JWT token)
  implementation("androidx.security:security-crypto:1.1.0-alpha06")

  // Google Fonts (Inter)
  implementation("androidx.compose.ui:ui-text-google-fonts")

  // Biometric authentication
  implementation("androidx.biometric:biometric:1.2.0-alpha05")
}
