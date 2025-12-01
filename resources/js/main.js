import "flowbite";

document.addEventListener("DOMContentLoaded", function () {
  const toolCards = document.querySelectorAll(
    ".tool-card[data-svg-hover-color]"
  );
  toolCards.forEach((card) => {
    const svgHoverColor = card.getAttribute("data-svg-hover-color");
    if (svgHoverColor) {
      card.style.setProperty("--svg-hover-color", svgHoverColor);
    }
  });
});
