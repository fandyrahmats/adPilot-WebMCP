/** Minimal identity of an entity a create tool just returned. */
export interface CreatedEntity {
  id: string;
  name: string;
}

/**
 * Shared shape for every dashboard form backed by a WebMCP tool call. Kept
 * out of src/app/actions.ts because a "use server" file may only export
 * async functions, not a type or a const.
 */
export interface ToolFormState {
  error: string | null;
  success: boolean;
  summary?: string;
  /** Page the created or changed entity lives on, if the tool returned one. */
  href?: string;
  /**
   * Id and name of the entity a create tool just made. Lets the hierarchy
   * wizard chain straight into the next level (e.g. hand the new campaign id
   * to the ad set step) without a round trip back to the server.
   */
  created?: CreatedEntity;
}

export const initialToolFormState: ToolFormState = {
  error: null,
  success: false,
};
