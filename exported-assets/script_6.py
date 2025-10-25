
# Create serializers.py
serializers_content = """from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
"""

with open(f"{base_dir}/api/serializers.py", "w") as f:
    f.write(serializers_content)

print("serializers.py created")
