<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAMPANHA AUTOMÁTICA - O GUIA</title>
    <style>
        :root { --primary: #00ff88; --bg: #000000; --card: #121212; }
        body { background: var(--bg); color: white; font-family: 'Segoe UI', sans-serif; margin: 0; padding: 0; text-align: center; }
        .hero { padding: 60px 20px; background: linear-gradient(180deg, #001a0e 0%, #000 100%); border-bottom: 1px solid var(--primary); }
        .hero h1 { font-size: 2.5rem; color: var(--primary); margin: 0; }
        .hero p { font-size: 1.1rem; color: #ccc; margin-top: 15px; }
        .ebook-visual {
            width: 200px; height: 280px; background: var(--primary); color: black;
            margin: 30px auto; border-radius: 5px 15px 15px 5px;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 1.5rem; box-shadow: 0 0 30px rgba(0,255,136,0.3);
            border-left: 10px solid #008f4c;
        }
        .features { padding: 40px 20px; text-align: left; max-width: 500px; margin: auto; }
        .feature-item { display: flex; align-items: center; margin-bottom: 15px; background: var(--card); padding: 15px; border-radius: 10px; border: 1px solid #222; }
        .feature-icon { color: var(--primary); font-size: 1.5rem; margin-right: 15px; }
        .price-section { padding: 40px 20px; background: var(--card); border-radius: 30px 30px 0 0; }
        .old-price { text-decoration: line-through; color: #666; font-size: 1rem; }
        .new-price { color: var(--primary); font-size: 3rem; font-weight: bold; margin: 10px 0; }
        .btn-buy {
            background: var(--primary); color: black; border: none; padding: 20px;
            width: 100%; max-width: 350px; border-radius: 50px;
            font-weight: bold; font-size: 1.3rem; cursor: pointer;
            box-shadow: 0 10px 20px rgba(0,255,136,0.2);
            transition: 0.3s;
        }
        #admin-panel { display: none; padding: 20px; border: 2px dashed var(--primary); margin: 20px; border-radius: 15px; }
    </style>
</head>
<body>
    <div class="hero">
        <h1>CAMPANHA AUTOMÁTICA</h1>
        <p>O Guia Mestre de 50 Páginas para Vender Todo Santo Dia sem Aparecer.</p>
        <div class="ebook-visual">EBOOK<br>MASTER</div>
    </div>
    <div class="features">
        <div class="feature-item"><span class="feature-icon">✔</span><div><b>Estratégia de Escala:</b> De 0 a 100 vendas.</div></div>
        <div class="feature-item"><span class="feature-icon">✔</span><div><b>Scripts Prontos:</b> Só copiar e colar.</div></div>
        <div class="feature-item"><span class="feature-icon">✔</span><div><b>50 Páginas:</b> Conteúdo direto ao ponto.</div></div>
    </div>
    <div class="price-section">
        <div class="old-price">De R$ 197,00</div>
        <div class="new-price">R$ 47,90</div>
        <button class="btn-buy" onclick="abrirPix()">QUERO ACESSO AGORA</button>
    </div>
    <div id="admin-panel">
        <h3 style="color:var(--primary)">PAINEL DE LIBERAÇÃO</h3>
        <p>Chave PIX: <b>seu-email@pix.com</b></p>
        <button onclick="liberar()" style="background:#fff; color:#000; padding:10px; border-radius:5px; border:none; font-weight:bold;">CONFIRMAR PAGAMENTO (ADM)</button>
    </div>
    <script>
        function abrirPix() {
            alert("SOLICITAÇÃO ENVIADA!");
            document.getElementById('admin-panel').style.display = 'block';
            window.scrollTo(0, document.body.scrollHeight);
        }
        function liberar() {
            window.location.href = "https://campanha-automatica.netlify.app/meu-ebook.pdf";
        }
    </script>
</body>
</html>
