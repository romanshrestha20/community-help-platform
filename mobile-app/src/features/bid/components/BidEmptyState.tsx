import React from "react";
import { Text } from "react-native";

import { Card, Stack } from "@/design-system";
import { AppButton } from "@/components/ui/AppButton";
import { useThemeContext } from "@/features/settings/hooks/useThemeContext";

type Props = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const BidEmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: Props) => {
  const { palette } = useThemeContext();

  return (
    <Card>
      <Stack gap="sm">
        <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: "700" }}>
          {title}
        </Text>
        <Text style={{ color: palette.textSecondary, fontSize: 14 }}>
          {description}
        </Text>
        {actionLabel && onAction ? (
          <AppButton title={actionLabel} onPress={onAction} />
        ) : null}
      </Stack>
    </Card>
  );
};