/**
 * Shared styles for form-based screens such as
 * Add Emergency Contact and Edit Emergency Contact.
 */

import { StyleSheet } from "react-native";
import { COLOR_TEXT, COLOR_TEXT_SECONDARY, COLOR_DANGER } from "./accountStyles";

export const formStyles = StyleSheet.create({
  /** Outer form wrapper */
  form: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  /** Label above an input field */
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: COLOR_TEXT,
    marginBottom: 8,
  },

  /** Standard bordered text input */
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLOR_TEXT,
    marginBottom: 16,
  },

  /** Centered disclaimer / helper text below a form */
  disclaimer: {
    fontSize: 14,
    color: COLOR_TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },

  /** Row with trash icon + red "Remove" label */
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
  },

  /** Red text for destructive inline actions */
  deleteText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLOR_DANGER,
  },

  /** Bottom-anchored bar for primary CTA */
  bottomBar: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
});
