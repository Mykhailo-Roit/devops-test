# Deploy infra on Azure
- create RG
- create AKS cluster
- enable "application routing"  https://learn.microsoft.com/en-us/azure/aks/app-routing
   `az aks approuting enable --resource-group <ResourceGroupName> --name <ClusterName>`
- get kubeconfig
  `az account set --subscription <ID>`
  `az aks get-credentials --resource-group <ResourceGroupName> --name <ClusterName> --overwrite-existing`



# CI/CD
## Add secrets to Github
add repository secrets:
- DOCKERHUB_TOKEN: dockerhub token
- DOCKERHUB_USERNAME: dockerhub username
- K8S_CLUSTER: cluster name `<ClusterName>`
- KUBECONFIG: kubeconfig from `az aks get-credentials `
- REDIS_PASSWORD: password for Redis. Do not use quotes in password

# Edit "hosts" file
- Obtain application IP
  Get AKS IP
  `kubectl get service -n nestjs-redis-app nestjs-ingress -o jsonpath="{.status.loadBalancer.ingress[0].ip}"`
- edit `/etc/hosts` (for Linux) or `C:\windows\system32\drivers\etc\hosts` (for MacOS) and add line with site IP from previous step
e.g.
`10.11.12.13 nestjs-app.local`

Open site in browser
- [http://nestjs-app.local](http://nestjs-app.local) \
![Main page](img/app-main.png) \

- [http://nestjs-app.local/redis](http://nestjs-app.local/redis) - for Redis check \
![Redia check page](img/app-redis.png)


# Extra notes
- CI/CD can buld images for `amd64`, `arm64` arch. Pls uncomment proper line in [ci-cd.yml](/.github/workflows/ci-cd.yml)
- In Github Action on Summary page can see test results `Test Results Summary`
this app fails all tests
```markdown
# Test Results Summary 🧪

| Test Type  | Status   |
| ---------- | -------- |
| Linter     | ❌ Failed |
| Unit Tests | ❌ Failed |
| Coverage   | ❌ Failed |

**Branch:** `test`
**Commit:** `87433e5c6c67a6b65dcb5f25c37192d532433b99`
```
![Github Actions](img/github_action.png)

- added HPA Horizontal pod autoscaller
- k8s: Networks policy and monitoring manifests (commented now)
```yaml
        # deployment/k8s/monitoring.yaml
        # deployment/k8s/network-policy.yaml
```
in [pipelene](/.github/workflows/ci-cd.yml)


# Виконані вимоги



### 1. Dockerfile

- [✅] Створити оптимізований багатоетапний Dockerfile
- [✅] Використовувати офіційні базові образи
- [✅] Мінімізувати розмір кінцевого образу
- [✅] Налаштувати користувача без root прав
- [✅] Правильно обробити залежності Node.js
- [✅] Використовувати .dockerignore

### 2. CI/CD Pipeline

Налаштувати pipeline для GitHub Actions або GitLab CI з етапами:

- [✅] Збірка Docker образу
- [✅] Push образу в registry
- [✅] Деплой у Kubernetes
- [✅] Використання змінних середовища та secrets

### 3. Kubernetes Маніфести

- [✅] Deployment, Service, Ingress для NestJS додатку
- [✅] Deployment, Service для Redis
- [✅] ConfigMap, Secrets для конфігурації
- [✅] Правильні labels та selectors
- [✅] Resource limits та requests

### 4. Інтеграція з Redis

- [✅] Redis розгорнуто у кластері
- [✅] Додаток успішно підключається до Redis
- [✅] Ендпоінт `/redis` працює коректно

### 5. Secrets та Безпека

- [✅] Використання Kubernetes Secrets для чутливих даних
- [✅] Пароль Redis зберігається в Secret
- [✅] NetworkPolicy для обмеження трафіку (бонус)
- [✅] SecurityContext у pod'ах
- [✅] Не використовуються root права в контейнерах

### 6. Додаткові Вимоги

- [✅] Детальний README з інструкціями по налаштуванню
- [✅] Health checks та Autoscaler
- [✅] Коментарі в коді та маніфестах
- [ ] Моніторинг з Prometheus/Grafana  - `не вистачило часу`


# Architecture

## System Architecture Diagram

```mermaid
graph TB
    subgraph "GitHub"
        A[Code Repository]
        B[GitHub Actions]
    end

    subgraph "Docker Hub"
        C[Container Registry]
    end

    subgraph "Azure Kubernetes Service"
        subgraph "Namespace: nestjs-redis-app"
            D[Ingress Controller]
            E[NestJS Service]
            F[NestJS Deployment<br/>HPA enabled]
            G[Redis Service]
            H[Redis Deployment]
            I[ConfigMap]
            J[Secrets]
            K[PVC - Redis Data]
        end
    end

    L[User Browser]

    A -->|Push/PR| B
    B -->|Build & Push Image| C
    B -->|Deploy| F
    L -->|HTTP Request| D
    D -->|Route to| E
    E -->|Forward to| F
    F -->|Read Config| I
    F -->|Read Secrets| J
    F -->|Connect to| G
    G -->|Route to| H
    H -->|Use| K
    H -->|Read Secrets| J

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style F fill:#fbb,stroke:#333,stroke-width:2px
    style H fill:#fbb,stroke:#333,stroke-width:2px
```

## CI/CD Pipeline Flow

```mermaid
flowchart LR
    A[Developer Push] --> B{GitHub Actions}
    B --> C[Lint Code]
    B --> D[Run Unit Tests]
    B --> E[Check Coverage]
    C --> F{All Checks Pass?}
    D --> F
    E --> F
    F -->|Yes| G[Build Docker Image]
    F -->|No| H[Fail Pipeline]
    G --> I[Multi-arch Build<br/>amd64/arm64]
    I --> J[Push to DockerHub]
    J --> K[Deploy to AKS]
    K --> L[Update K8s Resources]
    L --> M[Health Check]
    M --> N{Healthy?}
    N -->|Yes| O[Deployment Success]
    N -->|No| P[Rollback]

    style A fill:#e1f5ff
    style G fill:#fff4e1
    style J fill:#e8f5e9
    style O fill:#c8e6c9
    style H fill:#ffcdd2
    style P fill:#ffcdd2
```

## Kubernetes Resource Dependencies

```mermaid
graph TD
    A[Namespace: nestjs-redis-app] --> B[ConfigMap]
    A --> C[Secrets]
    A --> D[PVC]
    A --> E[NestJS Deployment]
    A --> F[Redis Deployment]
    A --> G[NestJS Service]
    A --> H[Redis Service]
    A --> I[Ingress]
    A --> J[HPA]
    A --> K[Network Policy]

    E -->|reads| B
    E -->|reads| C
    E -->|connects to| H
    F -->|reads| C
    F -->|mounts| D
    G -->|selects| E
    H -->|selects| F
    I -->|routes to| G
    J -->|scales| E
    K -->|protects| E
    K -->|protects| F

    style A fill:#e3f2fd
    style B fill:#fff9c4
    style C fill:#ffccbc
    style E fill:#c5e1a5
    style F fill:#c5e1a5
```

## Application Flow

```mermaid
sequenceDiagram
    participant User
    participant Ingress
    participant NestJS
    participant Redis

    User->>Ingress: GET nestjs-app.local/
    Ingress->>NestJS: Forward request
    NestJS->>User: Return main page

    User->>Ingress: GET nestjs-app.local/redis
    Ingress->>NestJS: Forward request
    NestJS->>Redis: Check connection
    Redis-->>NestJS: Connection status
    NestJS->>User: Return {status: true/false}
```
