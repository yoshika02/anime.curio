document.addEventListener('DOMContentLoaded', () => {
  // Cart Logic
  let cartCount = 0;
  const cartBtn = document.getElementById('cart-btn');
  const addButtons = document.querySelectorAll('.btn-add');

  addButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      cartCount++;
      cartBtn.textContent = `Cart (${cartCount})`;
      
      // Animation effect on button
      const originalText = button.textContent;
      button.textContent = 'Added!';
      button.style.background = 'var(--accent-secondary)';
      button.style.color = 'var(--bg-color)';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'transparent';
        button.style.color = 'var(--accent-secondary)';
      }, 1000);
    });
  });

  // Scroll Animation using IntersectionObserver
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    observer.observe(card);
  });

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
});
