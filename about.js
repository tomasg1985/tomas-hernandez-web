const featureSlider = document.querySelector(".feature-container");
const previousFeatureButton = document.querySelector("[data-feature-prev]");
const nextFeatureButton = document.querySelector("[data-feature-next]");

if (featureSlider && previousFeatureButton && nextFeatureButton) {
    const featureSlides = Array.from(featureSlider.querySelectorAll(".feature-column"));
    const mobileSlider = window.matchMedia("(max-width: 768px)");

    const getCurrentSlideIndex = () => Math.round(featureSlider.scrollLeft / featureSlider.clientWidth);

    const updateFeatureButtons = () => {
        const currentSlideIndex = getCurrentSlideIndex();
        previousFeatureButton.disabled = !mobileSlider.matches || currentSlideIndex === 0;
        nextFeatureButton.disabled = !mobileSlider.matches || currentSlideIndex >= featureSlides.length - 1;
    };

    previousFeatureButton.addEventListener("click", () => {
        const previousIndex = Math.max(0, getCurrentSlideIndex() - 1);
        featureSlider.scrollTo({ left: previousIndex * featureSlider.clientWidth, behavior: "smooth" });
    });

    nextFeatureButton.addEventListener("click", () => {
        const nextIndex = Math.min(featureSlides.length - 1, getCurrentSlideIndex() + 1);
        featureSlider.scrollTo({ left: nextIndex * featureSlider.clientWidth, behavior: "smooth" });
    });

    featureSlider.addEventListener("scroll", updateFeatureButtons, { passive: true });
    window.addEventListener("resize", updateFeatureButtons);
    mobileSlider.addEventListener("change", updateFeatureButtons);
    updateFeatureButtons();
}
