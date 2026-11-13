const byId = id => document.getElementById(id);
const form = byId('register');
const inputs = ['alias','email','password','confirm'].map(byId);
const [alias,email,password,confirm] = inputs;
const terms = byId('terms');
const visited = new Set();
const validation = {
  alias: () => {
    const value = alias.value.trim();
    if (!value) return 'Introduce tu alias.';
    if (value.length < 3 || value.length > 20) return 'El alias debe tener entre 3 y 20 caracteres.';
    return /^[\p{L}0-9_-]+$/u.test(value) ? '' : 'Usa solo letras, números, guion bajo (_) o guion (-).';
  },
  email: () => {
    if (!email.value.trim()) return 'Introduce tu correo electrónico.';
    return email.validity.typeMismatch || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value) ? 'Introduce un correo válido, como jugador@ejemplo.com.' : '';
  },
  password: () => {
    if (!password.value) return 'Introduce una contraseña.';
    return password.value.length < 8 ? 'La contraseña debe tener al menos 8 caracteres.' : '';
  },
  confirm: () => {
    if (!confirm.value) return 'Confirma tu contraseña.';
    return confirm.value !== password.value ? 'Las contraseñas no coinciden.' : '';
  }
};

function updateOperator(id, state, label) {
  const item = byId('id-' + id);
  item.dataset.state = state;
  item.textContent = label;
}

function setError(input, message) {
  input.setAttribute('aria-invalid', String(Boolean(message)));
  const error = byId(input.id + '-error');
  if (error.textContent !== message) error.textContent = message;
}

function validate(input) {
  visited.add(input.id);
  const message = validation[input.id]();
  setError(input, message);
  input.parentElement.querySelector('.valid').hidden = Boolean(message);
  updateOperator(input.id, message ? 'invalid' : 'valid',
    message ? 'Revisar' : input === alias ? alias.value.trim() : 'Validado');
  return !message;
}

function updateStrength() {
  const value = password.value;
  const score = value.length < 8 ? Number(Boolean(value)) : Math.min(4, 1 +
    Number(value.length >= 12) +
    Number(/\p{Lu}/u.test(value) && /\p{Ll}/u.test(value)) +
    Number(/[0-9]/.test(value)) + Number(/[\p{P}\p{S}]/u.test(value)));
  const meter = byId('strength');
  const label = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'][score];
  meter.hidden = score === 0;
  meter.dataset.level = score;
  meter.querySelectorAll('.bars i').forEach((bar, index) => bar.classList.toggle('lit', index < score));
  byId('strength-label').textContent = label;
  const announcement = label ? 'Seguridad de la contraseña: ' + label : '';
  if (byId('strength-status').textContent !== announcement) byId('strength-status').textContent = announcement;
}

function clearSummary() {
  byId('summary').textContent = '';
}
inputs.forEach(input => {
  input.addEventListener('blur', () => {
    if (input === alias) input.value = input.value.trim();
    if (input.value || visited.has(input.id)) validate(input);
  });
  input.addEventListener('input', () => {
    clearSummary();
    if (visited.has(input.id)) validate(input);
    if (input === password) {
      updateStrength();
      if (visited.has(confirm.id)) validate(confirm);
    }
  });
});

function showPassword(button, visible) {
  byId(button.getAttribute('aria-controls')).type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(visible));
}
const eyes = [...document.querySelectorAll('.eye')];
eyes.forEach(button => button.addEventListener('click', () => showPassword(button, button.getAttribute('aria-pressed') === 'false')));
[password,confirm].forEach(input => {
  const hint = byId('caps-' + input.id);
  const updateCaps = event => {
    const message = event.getModifierState('CapsLock') ? 'Bloq Mayús activado.' : '';
    if (hint.textContent !== message) hint.textContent = message;
  };
  input.addEventListener('keydown', updateCaps);
  input.addEventListener('keyup', updateCaps);
  input.addEventListener('blur', () => { hint.textContent = ''; });
});
terms.addEventListener('change', () => {
  setError(terms, '');
  clearSummary();
  updateOperator('terms', terms.checked ? 'valid' : '', terms.checked ? 'Aceptados' : 'Pendiente');
});
byId('show-terms').addEventListener('click', () => byId('terms-dialog').showModal());

let transmitting = false;
form.addEventListener('submit', event => {
  event.preventDefault();
  if (transmitting) return;
  clearSummary();
  alias.value = alias.value.trim();
  const invalid = inputs.filter(input => !validate(input));
  setError(terms, terms.checked ? '' : 'Acepta los términos y condiciones para continuar.');
  updateOperator('terms', terms.checked ? 'valid' : 'invalid', terms.checked ? 'Aceptados' : 'Revisar');
  if (!terms.checked) invalid.push(terms);
  if (invalid.length) {
    const summary = byId('summary');
    summary.textContent = invalid.length === 1 ? '1 campo necesita atención.' : invalid.length + ' campos necesitan atención.';
    invalid[0].focus();
    const panel = form.closest('.panel');
    panel.classList.remove('shake');
    void panel.offsetWidth;
    panel.classList.add('shake');
    return;
  }
  transmitting = true;
  eyes.forEach(button => showPassword(button, false));
  byId('fields').disabled = true;
  byId('submit-label').textContent = 'Transmitting_';
  byId('protocol').textContent = 'Transmitiendo registro';
  byId('status').textContent = 'Transmitiendo registro.';
  window.setTimeout(() => {
    byId('success-message').textContent = 'Bienvenido a NEONCORE, ' + alias.value + '. Tu registro de prueba se completó.';
    form.reset();
    updateStrength();
    form.hidden = true;
    byId('result').hidden = false;
    byId('protocol').textContent = 'Registro completado';
    byId('status').textContent = byId('success-message').textContent;
    byId('success-title').focus();
  }, 950);
});
