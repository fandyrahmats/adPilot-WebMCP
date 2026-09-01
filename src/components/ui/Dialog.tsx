"use client";

import {
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

/**
 * The browser allows several native <dialog> elements to be modal at once
 * (that is intentional, e.g. a confirm dialog opened from within another
 * dialog) - it does not enforce "one modal at a time" for you. Only the most
 * recently opened modal stays interactive; anything opened before it goes
 * inert, close button included.
 *
 * This app never wants two stacked at once, so this module tracks whichever
 * Dialog opened most recently and force-closes the previous one. Several
 * pages mount more than one Dialog (the ad set page has both the budget
 * editor and the create-hierarchy wizard), so this guards that state rather
 * than trusting call sites to coordinate.
 */
let activeDialogId: string | null = null;
let closeActiveDialog: (() => void) | null = null;

function requestDialogOpen(id: string, close: () => void): void {
  if (activeDialogId && activeDialogId !== id) {
    closeActiveDialog?.();
  }
  activeDialogId = id;
  closeActiveDialog = close;
}

function releaseDialog(id: string): void {
  if (activeDialogId === id) {
    activeDialogId = null;
    closeActiveDialog = null;
  }
}

type DialogSize = "sm" | "md" | "lg" | "xl";

/**
 * Width scale for content that actually needs it: a simple two-field form
 * has no business at the same width as a multi-column wizard step. Values
 * follow the same widths professional dashboards use for dialogs (roughly
 * 384 / 512 / 672 / 768px), not arbitrary numbers.
 */
const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Content width. Defaults to "md"; use "lg" or "xl" for multi-column or
   * multi-step content instead of letting it cram into a narrow column. */
  size?: DialogSize;
}

/**
 * Built on the native <dialog> element so focus trapping, Escape-to-close, and
 * the backdrop come from the platform instead of hand-rolled a11y logic.
 *
 * Structured as header / scrollable body / sticky footer, capped to the
 * viewport height, so a tall form scrolls internally instead of the dialog
 * overflowing the screen, and the primary action (in DialogFooter) stays
 * reachable without scrolling to find it. This is the baseline expectation
 * for a modal, not a cosmetic extra.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Reuse the title's id as this Dialog instance's identity for the
  // single-active-dialog tracker; it is already unique per mounted Dialog.
  const dialogId = titleId;

  // Callers pass `onClose={() => setOpen(false)}` inline, a new function
  // identity every render. Reading it through a ref keeps the effect below
  // from re-running on every unrelated re-render, while still always
  // invoking whichever onClose is current if this dialog gets force-closed.
  // The assignment itself happens in its own effect, not inline during
  // render, since writing to a ref during render is unsafe.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // requestDialogOpen always runs when `open` is true, not only when the
    // node was actually closed. It is idempotent (re-claiming the same id is
    // a no-op), and this keeps the active-dialog tracker correct even when
    // React (in StrictMode dev) runs this effect's mount -> cleanup -> mount
    // sequence twice: the second mount must re-register this dialog as
    // active even though the DOM node was already open and skips
    // showModal(). Calling showModal() on an already-open dialog throws, so
    // that DOM call alone stays gated behind `!node.open`.
    if (open) {
      requestDialogOpen(dialogId, () => onCloseRef.current());
      if (!node.open) node.showModal();
    } else if (node.open) {
      node.close();
      releaseDialog(dialogId);
    }

    return () => {
      releaseDialog(dialogId);
    };
  }, [open, dialogId]);

  // Escape (or any other native close, e.g. a future <form method="dialog">
  // submit) fires the browser's own `close` event directly on the element,
  // bypassing the `open` prop entirely until the resulting onClose call
  // re-renders this component. Releasing the tracker here too, not only in
  // the effect above, means the active-dialog id never lags behind reality
  // in the meantime.
  const handleNativeClose = () => {
    releaseDialog(dialogId);
    onClose();
  };

  return (
    <dialog
      ref={ref}
      onClose={handleNativeClose}
      onCancel={handleNativeClose}
      aria-labelledby={titleId}
      className={cn(
        // Tailwind's preflight resets margin on every element, which is what
        // normally centers a native <dialog> via the UA stylesheet's
        // `margin: auto`. Fixed positioning plus a translate keeps it
        // centered regardless of that reset.
        //
        // Width is viewport-relative with a fixed gutter (not w-full), so the
        // dialog never touches the screen edge on narrow viewports. Height is
        // capped below 100vh with a fixed margin, and the body scrolls
        // internally, so the dialog can never grow taller than the screen.
        //
        // The display pair matters: a closed <dialog> is hidden only by the
        // UA rule `dialog:not([open]) { display: none }`, so applying a bare
        // `flex` here would override it and leave the dialog permanently
        // visible as a static, non-modal box that no close button can
        // dismiss. `hidden` keeps it collapsed while closed and `open:flex`
        // turns on the header/body/footer column layout only once the
        // element actually has the open attribute.
        "bg-card text-card-foreground fixed top-1/2 left-1/2 hidden max-h-[calc(100vh-4rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border p-0 shadow-2xl open:flex backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        sizeClasses[size],
        className,
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b px-6 py-5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-semibold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {description}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close dialog"
          onClick={onClose}
          className="-mt-1 -mr-1 shrink-0"
        >
          <X />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6">{children}</div>
    </dialog>
  );
}

/**
 * Pinned to the bottom of the dialog's scroll area via `sticky`, not fixed
 * outside it, so the primary action stays visible while scrolling through a
 * long form instead of disappearing off the bottom of the viewport.
 *
 * The negative margins cancel the body's own padding on all three sides
 * (`-mx-6 -mb-6`) so the bar reaches the true edges of the scroll container
 * and re-applies its own `px-6 py-4`, rather than floating with a gap of
 * bare background beneath it. This works with or without a footer present:
 * content with no footer still gets the body's own bottom padding.
 */
export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card sticky -mx-6 -mb-6 bottom-0 mt-6 flex items-center justify-end gap-2 border-t px-6 py-4",
        className,
      )}
      {...props}
    />
  );
}
