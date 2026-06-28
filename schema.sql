-- Drop tables if exist
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    category VARCHAR(50) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Admin User (Email: admin@genjoy.com, Senha: admin123)
INSERT INTO users (name, email, password_hash) VALUES (
    'Administrador Genjoy',
    'admin@genjoy.com',
    '$2b$10$62jpWi5sZYxoCfpIxNyq0.YDheMAKHDhc4d8IBV/6F/D3011Hnx8G'
);

-- Seed premium product catalog for Celulares and Caixas de Som
INSERT INTO products (name, description, price, image_url, category, stock) VALUES
(
    'iPhone 15 Pro Max 256GB', 
    'Aparelho premium com acabamento em titânio, câmera tripla de 48MP, Zoom óptico de 5x, tela Super Retina XDR de 6.7" e chip A17 Pro super veloz.', 
    8999.00, 
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80', 
    'Celulares', 
    10
),
(
    'Samsung Galaxy S24 Ultra 512GB', 
    'Smartphone premium com tela QHD+ de 6.8", caneta S-Pen integrada, corpo em titânio, processador Snapdragon 8 Gen 3 e recursos avançados de IA.', 
    7299.00, 
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80', 
    'Celulares', 
    8
),
(
    'Xiaomi 14 Ultra 512GB', 
    'O celular definitivo para fotografia, equipado com sensor de câmera de 1 polegada com lentes ópticas Leica, tela AMOLED de 120Hz e carregamento de 90W.', 
    6899.00, 
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80', 
    'Celulares', 
    5
),
(
    'JBL Boombox 3', 
    'Caixa de som Bluetooth portátil com áudio potente e graves profundos (som de 3 vias), resistente a poeira e água (IP67) e bateria de 24 horas.', 
    2299.00, 
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80', 
    'Caixas de Som', 
    15
),
(
    'JBL Flip 6', 
    'Caixa de som portátil à prova d''água e poeira IP67, com som nítido e potente de duas vias, e até 12 horas de reprodução contínua.', 
    649.00, 
    'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=800&auto=format&fit=crop&q=80', 
    'Caixas de Som', 
    30
),
(
    'Amazon Echo Pop Alexa', 
    'Smart speaker compacto com som direcionado e assistente Alexa integrada. Controle dispositivos de casa inteligente com comandos de voz fáceis.', 
    349.00, 
    'https://images.unsplash.com/photo-1614851099175-e5b30eb6f696?w=800&auto=format&fit=crop&q=80', 
    'Caixas de Som', 
    20
);
