import Image from "next/image";
import type { CSSProperties } from "react";
import type { Photo } from "@/lib/photos";
import FadeOut from "./FadeOut";
import styles from "./photos.module.css";

// HTML command buttons open and close the dialog without JavaScript. React
// passes these attributes through but doesn't type them yet, hence spreads.
const open = { commandfor: "photos", command: "show-modal" };
const close = { commandfor: "photos", command: "close" };

const portraitSizes = "(max-width: 599px) 96px, 160px";

/**
 * The About portrait with the next three photos fanned behind it. Clicking it
 * opens a sheet with every photo; picking one (a radio button) brings it
 * forward with its caption. HTML and CSS, apart from FadeOut.
 */
export default function Photos({ photos }: { photos: Photo[] }) {
  const [portrait, ...rest] = photos;
  if (!rest.length)
    return (
      <figure className={styles.portrait}>
        <Image {...image(portrait)} alt={portrait.alt} sizes={portraitSizes} />
        <figcaption dangerouslySetInnerHTML={{ __html: portrait.caption }} />
      </figure>
    );

  return (
    <>
      <figure className={styles.portrait}>
        <button
          type="button"
          className={styles.fan}
          {...open}
          aria-haspopup="dialog"
          aria-describedby="photos-hint"
        >
          {rest
            .slice(0, 3)
            .reverse()
            .map((photo) => (
              <Image
                key={photo.src}
                {...image(photo)}
                alt=""
                sizes={portraitSizes}
              />
            ))}
          <Image
            {...image(portrait)}
            alt={portrait.alt}
            sizes={portraitSizes}
          />
        </button>
        <figcaption id="photos-hint">click to see more photos</figcaption>
      </figure>

      <dialog id="photos" className={styles.sheet} aria-label="more photos">
        <button type="button" className={styles.close} {...close}>
          close <span aria-hidden="true">×</span>
        </button>
        <form
          className={styles.pile}
          style={{ "--count": photos.length } as CSSProperties}
        >
          {/* Bare paper closes the sheet, or puts a picked photo back. */}
          <button
            type="button"
            className={styles.paper}
            {...close}
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="reset"
            className={styles.paper}
            tabIndex={-1}
            aria-hidden="true"
          />
          {photos.map((photo, i) => {
            const lie =
              photo === portrait
                ? { size: 2, x: 0, y: 0, turn: -0.25 }
                : photo.lie;
            return (
              <div
                key={photo.src}
                className={styles.item}
                style={
                  {
                    "--i": i,
                    "--ratio": photo.width / photo.height,
                    "--size": lie.size,
                    "--x": lie.x,
                    "--y": lie.y,
                    "--turn": lie.turn,
                  } as CSSProperties
                }
              >
                <input
                  type="radio"
                  name="photo"
                  id={`photo-${i}`}
                  className={styles.radio}
                  aria-describedby={photo.caption ? `caption-${i}` : undefined}
                />
                <label
                  htmlFor={`photo-${i}`}
                  className={`${styles.print} ${photo === portrait ? styles.me : ""}`}
                >
                  <Image
                    {...image(photo)}
                    alt={photo.alt}
                    sizes="(max-width: 599px) 160px, 320px"
                  />
                </label>
                <div className={styles.focus}>
                  <figure>
                    <Image
                      {...image(photo)}
                      alt=""
                      sizes="(max-width: 599px) 90vw, 640px"
                    />
                    {photo.caption && (
                      <figcaption
                        id={`caption-${i}`}
                        dangerouslySetInnerHTML={{ __html: photo.caption }}
                      />
                    )}
                  </figure>
                </div>
              </div>
            );
          })}
        </form>
      </dialog>
      <FadeOut id="photos" />
    </>
  );
}

const image = ({ src, width, height }: Photo) => ({ src, width, height });
