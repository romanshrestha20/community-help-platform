import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card, Row, Stack } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";
import { HelpRequest } from "../types/helpRequest.types";
import {
  formatRequestBudget,
  formatRequestCreatedAt,
  formatRequestLocation,
  REQUEST_CATEGORY_LABELS,
} from "../utils/requestDisplay";
import { RequestStatusBadge } from "./RequestStatusBadge";

type Props = {
  request: HelpRequest;
  onPress?: () => void;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  secondaryActionDisabled?: boolean;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  footer?: React.ReactNode;
};

export const RequestCard = ({
  request,
  onPress,
  primaryActionLabel,
  secondaryActionLabel,
  primaryActionDisabled,
  secondaryActionDisabled,
  onPrimaryAction,
  onSecondaryAction,
  footer,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <Pressable onPress={onPress}>
      <Card>
        <Stack gap="sm">
          <Row justify="space-between" align="flex-start">
            <View style={styles.flex}>
              <Text style={[styles.title, { color: palette.textPrimary }]}>
                {request.title}
              </Text>
              <Text style={[styles.category, { color: palette.textSecondary }]}>
                {REQUEST_CATEGORY_LABELS[request.category] ?? request.category}
              </Text>
            </View>
            <RequestStatusBadge status={request.status} />
          </Row>

          <Text
            numberOfLines={2}
            style={[styles.description, { color: palette.textSecondary }]}
          >
            {request.description}
          </Text>

          <Row justify="space-between">
            <Text style={[styles.meta, { color: palette.textSecondary }]}>
              {formatRequestBudget(request)}
            </Text>
            <Text style={[styles.meta, { color: palette.textSecondary }]}>
              {request.bidCount} bid{request.bidCount === 1 ? "" : "s"}
            </Text>
          </Row>

          <Row justify="space-between">
            <Text style={[styles.meta, { color: palette.textSecondary }]}>
              {formatRequestLocation(request)}
            </Text>
            <Text style={[styles.meta, { color: palette.textSecondary }]}>
              {formatRequestCreatedAt(request.createdAt)}
            </Text>
          </Row>

          {primaryActionLabel || secondaryActionLabel ? (
            <Row gap="sm">
              {secondaryActionLabel ? (
                <AppButton
                  title={secondaryActionLabel}
                  onPress={onSecondaryAction ?? (() => { })}
                  variant="secondary"
                  fullWidth={false}
                  disabled={secondaryActionDisabled}
                />
              ) : null}

              {primaryActionLabel ? (
                <AppButton
                  title={primaryActionLabel}
                  onPress={onPrimaryAction ?? (() => { })}
                  fullWidth={false}
                  disabled={primaryActionDisabled}
                />
              ) : null}
            </Row>
          ) : null}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Stack>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  category: {
    fontSize: 13,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    fontSize: 13,
  },
  footer: {
    marginTop: 4,
  },
});