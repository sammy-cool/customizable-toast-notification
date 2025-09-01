export async function animateElement(
  element,
  animationType,
  animDurationMs,
  isEntering,
  easing
) {
  //   const onComplete = options.onComplete;

  let keyframes;
  let animationOptions = {
    duration: animDurationMs,
    fill: "forwards",
    easing,
  };

  switch (animationType) {
    case "fade":
      keyframes = isEntering
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [{ opacity: 1 }, { opacity: 0 }];
      break;

    case "slide":
      keyframes = isEntering
        ? [
            { transform: "translateY(20px)", opacity: 0 },
            { transform: "translateY(0)", opacity: 1 },
          ]
        : [
            { transform: "translateY(0)", opacity: 1 },
            { transform: "translateY(20px)", opacity: 0 },
          ];
      break;

    case "zoom":
      keyframes = isEntering
        ? [
            { transform: "scale(0.8)", opacity: 0 },
            { transform: "scale(1)", opacity: 1 },
          ]
        : [
            { transform: "scale(1)", opacity: 1 },
            { transform: "scale(0.8)", opacity: 0 },
          ];
      break;

    default:
      keyframes = [];
  }

  const animation = element.animate(keyframes, animationOptions);
  //   animation.onfinish = () => {
  //     if (onComplete) onComplete();
  //   };
}
