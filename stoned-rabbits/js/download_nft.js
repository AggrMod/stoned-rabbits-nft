// Create input form for showing and download option of an image. 

// meteen uitvoeren als de DOM klaar is
document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = 'https://we-assets.pinit.io/HL779o1Da5adreFHUmgmiJfWy6JJTRtJ2C641DandQq3/1f22ced6-0904-4196-99ce-f55d44ba1a46/';
  const maxId = 3333;

  // 1) container ophalen
  const container = document.getElementById('download-nft-form');
  if (!container) return;

  // 2) opbouw form
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.max = String(maxId);
  input.placeholder = `Enter a number between 1 and ${maxId}`;
  input.style.marginRight = '8px';
  input.classList.add('form-control')

  const btnGenerate = document.createElement('button');
  btnGenerate.textContent = 'Show nft';
  btnGenerate.classList.add('btn');

  const errorMsg = document.createElement('div');
  errorMsg.style.color = 'red';
  errorMsg.style.margin = '4px 0';

  const preview = document.createElement('div');
  preview.style.marginTop = '12px';

  // 3) event: generate
  btnGenerate.addEventListener('click', () => {
    // schoonmaken vorige content
    errorMsg.textContent = '';
    preview.innerHTML = '';

    const value = parseInt(input.value, 10);
    if (!value || value < 1 || value > maxId) {
      errorMsg.textContent = `Pick a valid number between 1 and ${maxId}.`;
      return;
    }

    // image element
    const img = document.createElement('img');
    img.src = baseUrl + value;
    img.alt = `NFT #${value}`;
    img.style.maxWidth = '70%';
    img.style.display = 'block';
    img.style.marginBottom = '8px';

    preview.appendChild(img);
    preview.appendChild(link);
  });

  // 4) append alles
  container.appendChild(input);
  container.appendChild(btnGenerate);
  container.appendChild(errorMsg);
  container.appendChild(preview);
});