/**
 * Shared style tokens and StyleSheet definitions used across
 * the Account / Settings feature screens.
 *
 * Extracting styles into a dedicated file keeps screen components
 * focused on layout and logic while making visual tweaks easy to
 * locate and audit in one place.
 */

import { StyleSheet } from "react-native";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                      */
/* ------------------------------------------------------------------ */

/** Primary navy used for CTAs and active tab icons */
export const COLOR_PRIMARY = "#0E3A78";

/** Body text colour */
export const COLOR_TEXT = "#0F172A";

/** Secondary / muted text colour */
export const COLOR_TEXT_SECONDARY = "#64748B";

/** Placeholder / disabled text colour */
export const COLOR_TEXT_DISABLED = "#94A3B8";

/** Thin divider / border colour */
export const COLOR_BORDER = "#F1F5F9";

/** Heavier divider colour (settings page) */
export const COLOR_DIVIDER = "#E2E8F0";

/** Danger / destructive action colour */
export const COLOR_DANGER = "#EF4444";

/** Success / toggle-on colour */
export const COLOR_SUCCESS = "#4ADE80";

/** Card / row background colour */
export const COLOR_SURFACE = "#FFFFFF";

/** Screen background for settings-type pages */
export const COLOR_BG_MUTED = "#F8FAFC";

/* ------------------------------------------------------------------ */
/*  Common patterns                                                    */
/* ------------------------------------------------------------------ */

export const commonStyles = StyleSheet.create({
  /** Full-screen white container */
  screenWhite: {
    flex: 1,
    backgroundColor: COLOR_SURFACE,
  },

  /** Full-screen muted container (settings) */
  screenMuted: {
    flex: 1,
    backgroundColor: COLOR_BG_MUTED,
  },

  /** Centered loading state */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLOR_SURFACE,
  },

  /** Standard horizontal content padding */
  contentPadding: {
    paddingHorizontal: 20,
  },

  /** Section wrapper with vertical spacing */
  section: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  /** Bold section title */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLOR_TEXT,
    marginBottom: 4,
  },

  /** Thin line divider indented from the left */
  divider: {
    height: 1,
    backgroundColor: COLOR_BORDER,
    marginLeft: 20,
  },

  /** Field label (small, muted) */
  fieldLabel: {
    fontSize: 13,
    color: COLOR_TEXT_DISABLED,
    marginBottom: 4,
  },

  /** Field value (normal size, dark) */
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
    color: COLOR_TEXT,
  },
});
