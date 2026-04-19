# Maven Settings

This directory contains Maven settings that ensure the project uses only public Maven repositories.

## Purpose

The `.mvn/settings.xml` file explicitly configures Maven to use Maven Central Repository (`https://repo.maven.apache.org/maven2`) for all dependencies and plugins, avoiding any private or internal repositories.

## Usage

Maven automatically uses settings from the `.mvn` directory when it exists. The workflow also explicitly specifies this settings file:

```bash
mvn clean package -B -s .mvn/settings.xml
```

## Why This Matters

- **Portability**: The project can be built on any machine with internet access
- **CI/CD**: GitHub Actions runners and deployment servers can resolve all dependencies
- **Security**: No reliance on private repositories that may not be accessible
- **Consistency**: All developers and build environments use the same repository configuration

## Verification

To verify all dependencies resolve from Maven Central:

```bash
cd backoffice
mvn dependency:resolve -B -s .mvn/settings.xml
```

All dependencies should be downloaded from `https://repo.maven.apache.org/maven2`.
