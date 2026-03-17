import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

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
      return "Verified and eligible for dispatch";
    }
    if (status === "rejected") {
      return "Needs an updated credential submission";
    }
    return "Submit credentials to unlock dispatching";
  }, [status]);

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
          <Text style={styles.eyebrow}>Responder verification</Text>
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
        placeholder="EMT, doctor, nurse, CPR-certified volunteer"
        placeholderTextColor="#94A3B8"
      />
      <TextInput
        style={styles.input}
        value={certificationNumber}
        onChangeText={setCertificationNumber}
        placeholder="License or certificate number"
        placeholderTextColor="#94A3B8"
      />
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional notes for the operations team"
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
            {isSubmitting ? "Working..." : "Submit verification"}
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => void handleDemoApprove()} disabled={isSubmitting}>
          <Text style={styles.secondaryButtonText}>Approve for demo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  eyebrow: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 27,
    maxWidth: 240,
  },
  statusChip: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusChipVerified: {
    backgroundColor: "#DCFCE7",
  },
  statusChipText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
    color: "#0F172A",
    fontSize: 14,
  },
  notesInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  reviewNote: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  secondaryButton: {
    backgroundColor: "#E0F2FE",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#0C4A6E",
    fontWeight: "800",
  },
});
