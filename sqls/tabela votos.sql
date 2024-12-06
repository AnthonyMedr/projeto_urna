CREATE TABLE votos (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- ID único do voto
    usuario_id INT NOT NULL,            -- Referência à matrícula (chave estrangeira)
    votou BOOLEAN DEFAULT FALSE,        -- Indica se o usuário já votou
    FOREIGN KEY (usuario_id) REFERENCES dados(Matricula)
);
