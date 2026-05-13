# Android 打包说明

本文记录本项目打包成 Android 可安装包的实际步骤。

## 目标产物

Debug APK 输出位置：

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

最近一次生成的 APK 信息：

```text
大小: 4,366,392 bytes
SHA-256: 2ABBEB044A8549BC00021B628F54EC3529320DCE2ED0B711D5017848092B49DC
```

Debug APK 可以直接传到 Android 手机安装测试。正式发布需要另外生成 release 签名包。

## 环境要求

- Node.js / npm 可用。
- Android Studio 已安装。
- 使用 Android Studio 自带 JBR 作为 Java 运行时：

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

- Android SDK 路径：

```text
C:\Users\19579\AppData\Local\Android\Sdk
```

本仓库的 `android/local.properties` 写入：

```properties
sdk.dir=C:/Users/19579/AppData/Local/Android/Sdk
```

当前 Android 配置：

```text
compileSdkVersion = 36
targetSdkVersion = 36
minSdkVersion = 24
Android Gradle Plugin = 8.13.0
Gradle wrapper = 8.14.3
```

## 打包步骤

在仓库根目录执行前端验证：

```powershell
npm.cmd test
npm.cmd run build
```

同步 Capacitor Web 产物到 Android 工程：

```powershell
npm.cmd run cap:sync
```

进入 Android 工程并生成 debug APK：

```powershell
cd android
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'C:\Users\19579\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
.\gradlew.bat assembleDebug
```

打包成功后查看产物：

```powershell
Get-Item app\build\outputs\apk\debug\app-debug.apk
Get-FileHash app\build\outputs\apk\debug\app-debug.apk -Algorithm SHA256
```

## 本次遇到的问题和处理

### JDK 版本不够

默认 `java` 指向 JDK 8，Android Gradle Plugin 8.13.0 需要 Java 11 或更高。

处理方式：使用 Android Studio 自带 JBR：

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
```

### Gradle 依赖下载慢或超时

`dl.google.com` 访问超时，导致 Android Gradle Plugin 传递依赖无法解析。

处理方式：在 `android/build.gradle` 的 `buildscript.repositories` 和 `allprojects.repositories` 中，把阿里云 Maven 镜像放到 `google()` / `mavenCentral()` 前面：

```gradle
maven { url 'https://maven.aliyun.com/repository/google' }
maven { url 'https://maven.aliyun.com/repository/central' }
maven { url 'https://maven.aliyun.com/repository/public' }
google()
mavenCentral()
```

### Android SDK 组件缺失

本机缺少：

```text
build-tools;35.0.0
platforms;android-36
```

标准做法是在 Android Studio SDK Manager 或 `sdkmanager` 中安装并接受 license。

本次机器没有找到 `sdkmanager.bat`，所以先写入 Android SDK license 文件，再从可访问的 Android SDK 镜像下载组件：

```text
https://mirrors.cloud.tencent.com/AndroidSDK/build-tools_r35_windows.zip
https://mirrors.cloud.tencent.com/AndroidSDK/platform-36_r02.zip
```

解压位置：

```text
C:\Users\19579\AppData\Local\Android\Sdk\build-tools\35.0.0
C:\Users\19579\AppData\Local\Android\Sdk\platforms\android-36
```

注意：`platform-36_r02.zip` 解压后必须包含：

```text
C:\Users\19579\AppData\Local\Android\Sdk\platforms\android-36\android.jar
C:\Users\19579\AppData\Local\Android\Sdk\platforms\android-36\source.properties
```

缺少 `source.properties` 时，Gradle 会报：

```text
Failed to find Platform SDK with path: platforms;android-36
```

## 常用命令

重新打 debug 包：

```powershell
npm.cmd run cap:sync
cd android
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'C:\Users\19579\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
.\gradlew.bat assembleDebug
```

清理 Android 构建：

```powershell
cd android
.\gradlew.bat clean
```

