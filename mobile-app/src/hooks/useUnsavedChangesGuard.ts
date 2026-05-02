import { useEffect } from "react";
import { Alert } from "react-native";
import { useNavigation } from "expo-router";

type Options = {
  enabled: boolean;
  title?: string;
  message?: string;
  onPromptShown?: () => void;
};

export const useUnsavedChangesGuard = ({
  enabled,
  title = "Discard changes?",
  message = "You have unsaved changes. If you leave now, your edits will be lost.",
  onPromptShown,
}: Options) => {
  const navigation = useNavigation();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = navigation.addListener("beforeRemove", (event) => {
      event.preventDefault();
      onPromptShown?.();

      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [enabled, message, navigation, title]);
};
