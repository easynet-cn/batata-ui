<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Nacos</h1>
        <p>服务发现和配置管理平台</p>
        <span class="version">v3.1.0</span>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="nacosStore.loading"
            @click="handleLogin"
            class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>默认账号: nacos / nacos</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";
import { useNacosStore } from "@/stores/nacos";

const router = useRouter();
const nacosStore = useNacosStore();

const loginFormRef = ref<FormInstance>();
const loginForm = reactive({
  username: "nacos",
  password: "nacos",
});

const loginRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      min: 2,
      max: 20,
      message: "用户名长度在 2 到 20 个字符",
      trigger: "blur",
    },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 3, max: 50, message: "密码长度在 3 到 50 个字符", trigger: "blur" },
  ],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  try {
    await loginFormRef.value.validate();
    const success = await nacosStore.login(
      loginForm.username,
      loginForm.password,
    );

    if (success) {
      ElMessage.success("登录成功");
      router.push("/");
    } else {
      ElMessage.error(nacosStore.error || "登录失败");
    }
  } catch (error) {
    console.error("登录验证失败:", error);
  }
};

// 检查是否已登录
onMounted(() => {
  if (nacosStore.isAuthenticated) {
    router.push("/");
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.login-header p {
  color: #6b7280;
  margin: 0 0 8px 0;
  font-size: 14px;
}

.version {
  display: inline-block;
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.login-form {
  margin-bottom: 24px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.login-footer {
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

:deep(.el-input__wrapper) {
  height: 44px;
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}

:deep(.el-form-item__error) {
  font-size: 12px;
}
</style>
