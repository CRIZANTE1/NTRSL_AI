# Importa certificado(s) da empresa no truststore do Gradle (rede corporativa / PKIX).
# O JBR do Android Studio NÃO suporta trustStoreType=Windows-ROOT.
#
# Uso básico:
#   .\scripts\setup-gradle-ssl-windows.ps1 -CertFile C:\caminho\netskope.cer
#
# CAs adicionais (ex.: BR Distribuidora CA Enterprise) — mesmo truststore:
#   $keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
#   & $keytool -importcert -noprompt -alias br-enterprise -file C:\caminho\br.cer `
#     -keystore "$env:USERPROFILE\.gradle\windows-truststore.jks" -storepass changeit
#
# Depois: cd android; .\gradlew --stop  →  Sync no Android Studio
# Documentação: docs/ANDROID.md#2-ssl--proxy--inspeção-https-na-rede-rede-corporativa

param(
    [Parameter(Mandatory = $true)]
    [string]$CertFile
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $CertFile)) {
    Write-Error "Arquivo não encontrado: $CertFile"
}

$jbrCandidates = @(
    "$env:LOCALAPPDATA\Programs\Android Studio\jbr",
    'C:\Program Files\Android\Android Studio\jbr',
    'C:\Program Files\Android\Android Studio1\jbr'
)

$jbrHome = $jbrCandidates | Where-Object { Test-Path "$_\bin\keytool.exe" } | Select-Object -First 1
if (-not $jbrHome) {
    Write-Error "JBR do Android Studio não encontrado."
}

$keytool = Join-Path $jbrHome 'bin\keytool.exe'
$cacerts = Join-Path $jbrHome 'lib\security\cacerts'
$gradleDir = Join-Path $env:USERPROFILE '.gradle'
$trustStore = Join-Path $gradleDir 'windows-truststore.jks'
$storePass = 'changeit'

New-Item -ItemType Directory -Force -Path $gradleDir | Out-Null
Copy-Item -Force $cacerts $trustStore

Write-Host "Importando certificado da empresa..."
& $keytool -importcert -noprompt -alias corp-ca -file $CertFile -keystore $trustStore -storepass $storePass

$trustStoreUnix = ($trustStore -replace '\\', '/')
$gradleProps = Join-Path $gradleDir 'gradle.properties'
$sslBlock = @"
# NTRSL — truststore Windows (scripts/setup-gradle-ssl-windows.ps1)
systemProp.javax.net.ssl.trustStore=$trustStoreUnix
systemProp.javax.net.ssl.trustStorePassword=$storePass
"@

if (Test-Path $gradleProps) {
    $content = Get-Content $gradleProps -Raw
    if ($content -match 'NTRSL — truststore Windows') {
        $content = $content -replace '(?ms)# NTRSL — truststore Windows.*?systemProp\.javax\.net\.ssl\.trustStorePassword=.*?\r?\n', ''
        $content = $content.TrimEnd() + "`r`n`r`n" + $sslBlock
        Set-Content -Path $gradleProps -Value $content -NoNewline
    } else {
        Add-Content -Path $gradleProps -Value "`r`n$sslBlock"
    }
} else {
    Set-Content -Path $gradleProps -Value $sslBlock
}

Write-Host "OK: $trustStore"
Write-Host "Próximo: cd android; .\gradlew.bat --stop  →  Sync no Android Studio"
