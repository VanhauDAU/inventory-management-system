from rest_framework import serializers


class ChatMessageSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant"])
    content = serializers.CharField(max_length=2000, trim_whitespace=True)


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, trim_whitespace=True)
    history = ChatMessageSerializer(many=True, required=False, default=list)

    def validate_history(self, value):
        return value[-10:]
