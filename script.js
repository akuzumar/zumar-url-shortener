// Redirect jika ada hash
const hash = window.location.hash.substring(1);
if (hash) {
  const url = localStorage.getItem(hash);
  if (url) {
    window.location.href = url;
  }
}

function shorten() {
  const longUrl = document.getElementById("longUrl").value;
  if (!longUrl) return alert("Masukkan URL!");

  const code = Math.random().toString(36).substring(2, 7);
  localStorage.setItem(code, longUrl);

  const shortUrl = `${location.origin}${location.pathname}#${code}`;
  document.getElementById("result").innerHTML = `
    <p>URL Pendek:</p>
    <a href="${shortUrl}" target="_blank">${shortUrl}</a>
  `;
}
