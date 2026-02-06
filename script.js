// KONFIGURASI - UBAH INI SESUAI DATA KAMU!
const CONFIG = {
    // 1. Ganti dengan username GitHub-mu
    GITHUB_USERNAME: 'akuzumar',
    
    // 2. Ganti dengan nama repository-mu
    REPO_NAME: 'zumar-url-shortener',
    
    // 3. Dapatkan GitHub Token (lihat cara di bawah)
    GITHUB_TOKEN: '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',
    
    // 4. Domain website-mu (setelah di-host di GitHub Pages)
    BASE_URL: 'https://akuzumar.github.io/zumar-url-shortener'
};

// File database di GitHub
const DB_FILE = 'url_database.json';

// ==================== FUNGSI UTAMA ====================

// Simpan data ke GitHub
async function saveToGitHub(data) {
    try {
        const url = `https://api.github.com/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/contents/${DB_FILE}`;
        
        // Cek apakah file sudah ada
        let sha = null;
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (response.ok) {
                const fileData = await response.json();
                sha = fileData.sha;
            }
        } catch (e) { /* File belum ada */ }

        // Encode data ke base64
        const content = btoa(JSON.stringify(data, null, 2));
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Update URL database',
                content: content,
                sha: sha
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Error save:', error);
        return false;
    }
}

// Baca data dari GitHub
async function loadFromGitHub() {
    try {
        const url = `https://api.github.com/repos/${CONFIG.GITHUB_USERNAME}/${CONFIG.REPO_NAME}/contents/${DB_FILE}`;
        const response = await fetch(url);
        
        if (response.ok) {
            const data = await response.json();
            const content = atob(data.content);
            return JSON.parse(content);
        }
        return {};
    } catch (error) {
        return {};
    }
}

// Buat short URL
function createShortUrl(alias) {
    return `${CONFIG.BASE_URL}/${alias}`;
}

// Generate random alias
function generateAlias() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// ==================== EVENT HANDLERS ====================

document.addEventListener('DOMContentLoaded', async function() {
    // Load existing links
    const links = await loadFromGitHub();
    displayLinks(links);
    
    // Create button handler
    document.getElementById('createBtn').addEventListener('click', async function() {
        const longUrl = document.getElementById('longUrl').value.trim();
        let alias = document.getElementById('customAlias').value.trim();
        
        if (!longUrl) {
            alert('Masukkan URL terlebih dahulu!');
            return;
        }
        
        if (!alias) {
            alias = generateAlias();
        }
        
        // Validasi alias (huruf kecil, angka, dash)
        if (!/^[a-z0-9\-]+$/.test(alias)) {
            alert('Alias hanya boleh huruf kecil, angka, dan tanda hubung (-)');
            return;
        }
        
        // Load current data
        const links = await loadFromGitHub();
        
        // Check if alias exists
        if (links[alias]) {
            alert('Alias sudah digunakan, coba yang lain!');
            return;
        }
        
        // Add new link
        links[alias] = {
            url: longUrl,
            created: new Date().toISOString(),
            clicks: 0
        };
        
        // Save to GitHub
        const success = await saveToGitHub(links);
        
        if (success) {
            // Show result
            const shortUrl = createShortUrl(alias);
            document.getElementById('shortUrlOutput').textContent = shortUrl;
            document.getElementById('result').style.display = 'block';
            
            // Update test link
            document.getElementById('testLink').href = shortUrl;
            
            // Reset form
            document.getElementById('longUrl').value = '';
            document.getElementById('customAlias').value = '';
            
            // Refresh list
            displayLinks(links);
        } else {
            alert('Gagal menyimpan. Cek GitHub Token!');
        }
    });
    
    // Copy button handler
    document.getElementById('copyBtn').addEventListener('click', function() {
        const text = document.getElementById('shortUrlOutput').textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert('Link disalin!');
        });
    });
});

// Display links
function displayLinks(links) {
    const container = document.getElementById('linksList');
    const aliases = Object.keys(links);
    
    if (aliases.length === 0) {
        container.innerHTML = '<p class="loading">Belum ada link yang dibuat</p>';
        return;
    }
    
    container.innerHTML = '';
    aliases.forEach(alias => {
        const link = links[alias];
        const shortUrl = createShortUrl(alias);
        
        const div = document.createElement('div');
        div.className = 'link-item';
        div.innerHTML = `
            <div>
                <strong>${shortUrl}</strong><br>
                <small>→ ${link.url}</small><br>
                <small>Dibuat: ${new Date(link.created).toLocaleDateString('id-ID')} | Klik: ${link.clicks}</small>
            </div>
            <button class="copy-btn" data-alias="${alias}">
                <i class="far fa-copy"></i> Salin
            </button>
        `;
        
        container.appendChild(div);
    });
    
    // Add copy events
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const alias = this.getAttribute('data-alias');
            navigator.clipboard.writeText(createShortUrl(alias));
            alert('Link disalin!');
        });
    });
}

// ==================== REDIRECT LOGIC ====================

// Cek jika ini adalah permintaan redirect (URL pendek)
if (window.location.pathname.length > 1) {
    const alias = window.location.pathname.substring(1);
    
    async function redirectToOriginal() {
        try {
            const links = await loadFromGitHub();
            
            if (links[alias]) {
                // Update click count
                links[alias].clicks = (links[alias].clicks || 0) + 1;
                await saveToGitHub(links);
                
                // Redirect
                window.location.href = links[alias].url;
            } else {
                // Jika alias tidak ditemukan, tampilkan error
                document.body.innerHTML = `
                    <div style="text-align: center; padding: 50px;">
                        <h1>❌ Link Tidak Ditemukan</h1>
                        <p>Short link <strong>${alias}</strong> tidak ada dalam database.</p>
                        <a href="${CONFIG.BASE_URL}" style="color: #2575fc;">
                            ← Kembali ke homepage
                        </a>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Redirect error:', error);
        }
    }
    
    redirectToOriginal();
}
