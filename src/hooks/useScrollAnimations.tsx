import { useEffect } from 'react';

export const useScrollAnimations = () => {
  useEffect(() => {
    // Intersection Observer for scroll-triggered animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

    // Parallax scrolling effect
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      const parallaxElements = document.querySelectorAll('[data-parallax]');
      
      parallaxElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        const speed = parseFloat(htmlElement.dataset.parallax || '0.5');
        const yPos = -(scrolled * speed);
        htmlElement.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });

      // Background parallax for the meal planning section
      const parallaxBg = document.querySelector('.parallax-bg');
      if (parallaxBg) {
        const speed = 0.3;
        const yPos = -(scrolled * speed);
        (parallaxBg as HTMLElement).style.transform = `translate3d(0, ${yPos}px, 0)`;
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);
};