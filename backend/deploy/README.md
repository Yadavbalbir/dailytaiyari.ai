# DailyTaiyari Backend Deployment Guide (AWS EC2 + Docker)

This guide provides step-by-step instructions for deploying the DailyTaiyari backend to an AWS EC2 instance.

## Prerequisites
- AWS Account
- EC2 SSH Key Pair (.pem file)

## Step 1: Launch EC2 Instance
1.  **Launch Instance** in AWS Console.
2.  **Choose AMI**: Ubuntu Server 24.04 LTS (HVM).
3.  **Instance Type**: t2.micro or t3.small (minimum 1GB RAM recommended).
4.  **Security Group**:
    *   Allow SSH (Port 22) - restricted to your IP.
    *   Allow HTTP (Port 80) - from anywhere.
    *   Allow HTTPS (Port 443) - from anywhere (optional, for SSL).

## Step 2: Install Docker on EC2
Connect to your instance via SSH:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

Install Docker and Docker Compose:
```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker:
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation:
sudo docker --version
sudo docker compose version
```

## Step 3: Deploy Backend
1.  **Clone Repository**:
    ```bash
    git clone https://github.com/your-username/DailyTaiyari.git
    cd DailyTaiyari/backend
    ```

2.  **Configure Environment**:
    ```bash
    cp .env.example .env
    nano .env
    # Update all variables (SECRET_KEY, DB_PASSWORD, ALLOWED_HOSTS, etc.)
    ```

3.  **Build and Run**:
    ```bash
    sudo docker compose up -d --build
    ```

4.  **Run Migrations**:
    ```bash
    sudo docker compose exec web python manage.py migrate
    sudo docker compose exec web python manage.py collectstatic --noinput
    ```

5.  **Create Superuser**:
    ```bash
    sudo docker compose exec web python manage.py createsuperuser
    ```

## Step 4: Verify Deployment
Access your API at `http://your-ec2-ip/api/v1/exams/`.
Docs: `http://your-ec2-ip/api/docs/`.

## Troubleshooting
- Check logs: `sudo docker compose logs -f`
- Restart services: `sudo docker compose restart`
