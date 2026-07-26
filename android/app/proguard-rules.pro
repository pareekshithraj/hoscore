# Keep kotlinx.serialization classes & DTOs for R8 / ProGuard
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-keepclassmembers class * {
    @kotlinx.serialization.Serializer *;
}
-keepclassmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}

-keep class com.example.hoscore.core.network.** { *; }
-keep class com.example.hoscore.core.model.** { *; }
