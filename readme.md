# Kafka Microservices Lab 🚀

Este laboratório didático demonstra uma arquitetura de microsserviços para um sistema de E-commerce utilizando **Apache Kafka** como barramento de eventos.

## 🏗️ Arquitetura

O sistema é composto por três serviços principais:

1.  **Order Service (Produtor)**: Recebe pedidos via API e publica eventos no tópico `order-events`.
2.  **Catalog Service (Consumidor)**: Escuta o tópico e simula a atualização de estoque.
3.  **Notification Service (Consumidor)**: Escuta o tópico e simula o envio de e-mails.

### Fluxo de Dados
`Frontend` -> `Order Service (API)` -> `Kafka (order-events)` -> `[Catalog, Notification]`

## 📚 Conceitos Chave do Kafka

-   **Topic**: Uma categoria ou canal onde as mensagens são armazenadas.
-   **Producer**: Aplicação que envia dados para um tópico.
-   **Consumer**: Aplicação que lê dados de um tópico.
-   **Partition**: Divisão de um tópico para permitir paralelismo e escalabilidade.
-   **Offset**: Um ID sequencial único para cada mensagem dentro de uma partição.

## 🚀 Como Executar

### 1. Iniciar Infraestrutura (Docker)
Certifique-se de ter o Docker instalado e execute:
```bash
docker-compose up -d
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Iniciar o Laboratório
```bash
npm run dev
```
O dashboard estará disponível em `http://localhost:3000`.

## 🧪 Testes
Para rodar os testes de integração:
```bash
npm test
```

## 🛠️ Tecnologias
-   **Backend**: Node.js, Express, KafkaJS
-   **Frontend**: React, Tailwind CSS, Motion, Lucide
-   **Infra**: Docker, Kafka, Zookeeper
