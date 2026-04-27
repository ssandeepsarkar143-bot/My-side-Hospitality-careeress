window.togglePw = function (id, btn) {
  const i = document.getElementById(id);
  if (!i) return;
  const eye = btn.querySelector('i');
  if (i.type === 'password') {
    i.type = 'text';
    if (eye) eye.className = 'fas fa-eye-slash';
    btn.title = 'Hide password';
  } else {
    i.type = 'password';
    if (eye) eye.className = 'fas fa-eye';
    btn.title = 'Show password';
  }
};
