// Shown while the 3D world's or 2D canvas's own JS chunk is still
// downloading -- both are dynamically imported (see PlayMode.tsx) so they
// don't add to the initial page load, which means there's a real async gap
// here worth a proper loading state for, unlike the mid-game freeze fixed
// in PlayMode.tsx's handleZoneEnter (that one was a blocking reflow, not
// something loading, so a loader animation couldn't have masked it -- it
// would have frozen right along with everything else).
//
// From Uiverse.io by AnnaVAnTiM (https://uiverse.io/AnnaVAnTiM/rare-pug-90),
// the HSL-brown "pencil" variant Asher picked over the default colors, with
// two changes: the graphite tip now renders in `currentColor` (was a
// hardcoded near-black, hsl(223,10%,10%), which all but disappeared
// against this site's near-black dark-mode background) instead of its own
// fixed color, so it and the drawn stroke line both read off the same
// `color` this component sets -- var(--spotlight), the site's own gold
// accent token, which already resolves to the correct shade in either
// theme with no dark/light-specific override needed here.
export function PlayLoader({ label }: { label: string }) {
  return (
    <div className="flex aspect-[4/3] flex-col items-center justify-center gap-4 rounded-2xl border border-amber-faint bg-stage">
      <svg className="pencil" viewBox="0 0 200 200" width="140" height="140" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <clipPath id="pencil-eraser">
            <rect rx="5" ry="5" width="30" height="30"></rect>
          </clipPath>
        </defs>
        <circle
          className="pencil__stroke"
          r="70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="439.82 439.82"
          strokeDashoffset="439.82"
          strokeLinecap="round"
          transform="rotate(-113,100,100)"
        ></circle>
        <g className="pencil__rotate" transform="translate(100,100)">
          <g fill="none">
            <circle
              className="pencil__body1"
              r="64"
              stroke="hsl(30, 30%, 50%)"
              strokeWidth="30"
              strokeDasharray="402.12 402.12"
              strokeDashoffset="402"
              transform="rotate(-90)"
            ></circle>
            <circle
              className="pencil__body2"
              r="74"
              stroke="hsl(30, 30%, 60%)"
              strokeWidth="10"
              strokeDasharray="464.96 464.96"
              strokeDashoffset="465"
              transform="rotate(-90)"
            ></circle>
            <circle
              className="pencil__body3"
              r="54"
              stroke="hsl(30, 30%, 40%)"
              strokeWidth="10"
              strokeDasharray="339.29 339.29"
              strokeDashoffset="339"
              transform="rotate(-90)"
            ></circle>
          </g>
          <g className="pencil__eraser" transform="rotate(-90) translate(49,0)">
            <g className="pencil__eraser-skew">
              <rect fill="hsl(30, 20%, 90%)" rx="5" ry="5" width="30" height="30"></rect>
              <rect fill="hsl(30, 20%, 85%)" width="5" height="30" clipPath="url(#pencil-eraser)"></rect>
              <rect fill="hsl(30, 20%, 80%)" width="30" height="20"></rect>
              <rect fill="hsl(30, 20%, 75%)" width="15" height="20"></rect>
              <rect fill="hsl(30, 20%, 85%)" width="5" height="20"></rect>
              <rect fill="hsla(30, 20%, 75%, 0.2)" y="6" width="30" height="2"></rect>
              <rect fill="hsla(30, 20%, 75%, 0.2)" y="13" width="30" height="2"></rect>
            </g>
          </g>
          <g className="pencil__point" transform="rotate(-90) translate(49,-30)">
            <polygon fill="hsl(33,90%,70%)" points="15 0,30 30,0 30"></polygon>
            <polygon fill="hsl(33,90%,50%)" points="15 0,6 30,0 30"></polygon>
            {/* Graphite tip -- currentColor, see file header comment */}
            <polygon fill="currentColor" points="15 0,20 10,10 10"></polygon>
          </g>
        </g>
      </svg>
      <p className="font-mono-stage text-xs uppercase tracking-[0.2em] text-stone/60">{label}</p>
    </div>
  );
}
