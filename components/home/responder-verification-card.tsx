import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalization } from "@/hooks/use-localization";

type VerificationState = {
  profile?: {
    verificationStatus?: "pending" | "verified" | "rejected";
    qualificationType?: string;
    certificationNumber?: string;
  } | null;
  latestSubmission?: {
    qualificationType?: string;
    certificationNumber?: string;
    reviewStatus?: "pending" | "approved" | "rejected";
    reviewNotes?: string;
  } | null;
};

type ResponderVerificationCardProps = {
  verificationState: VerificationState | null | undefined;
  onSubmitVerification: (input: {
    qualificationType: string;
    certificationNumber?: string;
    notes?: string;
  }) => Promise<void>;
  onApproveDemo: () => Promise<void>;
};

export function ResponderVerificationCard({
  verificationState,
  onSubmitVerification,
  onApproveDemo,
}: ResponderVerificationCardProps) {
  const { t } = useLocalization();
  const [qualificationType, setQualificationType] = useState(
    verificationState?.profile?.qualificationType ??
      verificationState?.latestSubmission?.qualificationType ??
      "CPR-certified volunteer",
  );
  const [certificationNumber, setCertificationNumber] = useState(
    verificationState?.profile?.certificationNumber ??
      verificationState?.latestSubmission?.certificationNumber ??
      "",
  );
  const [notes, setNotes] = useState(
    verificationState?.latestSubmission?.reviewNotes ?? "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = verificationState?.profile?.verificationStatus ?? "pending";
  const reviewLabel = useMemo(() => {
    if (status === "verified") {
      return t("resp_verified_desc");
    }
    if (status === "rejected") {
      return t("resp_rejected_desc");
    }
    return t("resp_pending_desc");
  }, [status, t]);

  async function handleSubmit() {
    if (!qualificationType.trim()) {
      Alert.alert("Missing qualification", "Add the training or credential you want reviewed.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitVerification({
        qualificationType: qualificationType.trim(),
        certificationNumber: certificationNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDemoApprove() {
    setIsSubmitting(true);
    try {
      await onApproveDemo();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{t("resp_verification_title")}</Text>
          <Text style={styles.title}>{reviewLabel}</Text>
        </View>
        <View style={[styles.statusChip, status === "verified" && styles.statusChipVerified]}>
          <Text style={styles.statusChipText}>{status}</Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        value={qualificationType}
        onChangeText={setQualificationType}
        placeholder={t("resp_placeholder_qualification")}
        placeholderTextColor="#94A3B8"
      />
      <TextInput
        style={styles.input}
        value={certificationNumber}
        onChangeText={setCertificationNumber}
        placeholder={t("resp_placeholder_cert")}
        placeholderTextColor="#94A3B8"
      />
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder={t("resp_placeholder_notes")}
        placeholderTextColor="#94A3B8"
        multiline
      />

      {verificationState?.latestSubmission?.reviewNotes ? (
        <Text style={styles.reviewNote}>
          Latest note: {verificationState.latestSubmission.reviewNotes}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => void handleSubmit()} disabled={isSubmitting}>
          <Text style={styles.primaryButtonText}>
            {isSubmitting ? "Working..." : t("resp_btn_submit")}
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => void handleDemoApprove()} disabled={isSubmitting}>
          <Text style={styles.secondaryButtonText}>{t("resp_btn_approve_demo")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 20,
  },
  eyebrow: {
    color: "#4BAEE8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 6,
    fontFamily: "InterSemiBold",
  },
  title: {
    color: "#1A1C22",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 27,
    maxWidth: 240,
    fontFamily: "InterBold",
  },
  statusChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "rgba(165, 165, 165, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipVerified: {
    backgroundColor: "rgba(75, 174, 232, 0.1)",
  },
  statusChipText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    fontFamily: "InterSemiBold",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
    color: "#1A1C22",
    fontSize: 14,
    fontFamily: "Inter",
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  reviewNote: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    fontFamily: "Inter",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: "rgba(13, 13, 13, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    // Glass shimmer effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: "#1A1C22",
    fontWeight: "700",
    fontFamily: "InterBold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  secondaryButtonText: {
    color: "#6B7280",
    fontWeight: "600",
    fontFamily: "InterSemiBold",
  },
});
