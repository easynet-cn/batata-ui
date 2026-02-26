<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click="close">
      <div class="modal !max-w-3xl" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('sampleCode') }}</h3>
          <button @click="close" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <!-- Tabs -->
          <div class="flex gap-1 border-b border-border">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="activeTab = tab.key"
              class="px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px"
              :class="
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              "
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Code Content -->
          <CodeEditor :model-value="currentCode" :language="codeLang" readonly min-height="250px" />
        </div>
        <div class="modal-footer">
          <button @click="copyCode" class="btn btn-secondary">
            <Copy class="w-3.5 h-3.5" />
            {{ t('copy') }}
          </button>
          <button @click="close" class="btn btn-primary">{{ t('close') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Copy } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import CodeEditor from '@/components/common/CodeEditor.vue'
import { logger } from '@/utils/logger'
import type { ConfigType } from '@/types'

const props = defineProps<{
  modelValue: boolean
  dataId: string
  groupName: string
  mode?: 'config' | 'service'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const activeTab = ref('java')

const tabs = [
  { key: 'java', label: 'Java' },
  { key: 'springboot', label: 'Spring Boot' },
  { key: 'python', label: 'Python' },
  { key: 'go', label: 'Go' },
  { key: 'shell', label: 'cURL' },
]

const codeLang = computed((): ConfigType => {
  return 'text'
})

const currentCode = computed(() => {
  if (props.mode === 'service') {
    return getServiceCode(activeTab.value)
  }
  return getConfigCode(activeTab.value)
})

function getConfigCode(tab: string): string {
  const dataId = props.dataId
  const group = props.groupName

  switch (tab) {
    case 'java':
      return `import com.alibaba.nacos.api.NacosFactory;
import com.alibaba.nacos.api.config.ConfigService;
import java.util.Properties;

Properties properties = new Properties();
properties.put("serverAddr", "localhost:8848");
// properties.put("namespace", "your-namespace-id");

ConfigService configService = NacosFactory.createConfigService(properties);

// Get config
String content = configService.getConfig("${dataId}", "${group}", 5000);
System.out.println(content);

// Listen for changes
configService.addListener("${dataId}", "${group}", new Listener() {
    @Override
    public Executor getExecutor() { return null; }

    @Override
    public void receiveConfigInfo(String configInfo) {
        System.out.println("Config changed: " + configInfo);
    }
});`

    case 'springboot':
      return `# application.properties
spring.cloud.nacos.config.server-addr=localhost:8848
spring.cloud.nacos.config.namespace=
spring.cloud.nacos.config.group=${group}

# pom.xml dependency
# <dependency>
#     <groupId>com.alibaba.cloud</groupId>
#     <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
# </dependency>

# bootstrap.properties
spring.application.name=${dataId.replace(/\.\w+$/, '')}
spring.cloud.nacos.config.file-extension=${dataId.includes('.') ? dataId.split('.').pop() : 'properties'}

// Use @Value or @ConfigurationProperties to inject config
@Value("\${your.config.key:default}")
private String configValue;`

    case 'python':
      return `import nacos

SERVER_ADDRESSES = "localhost:8848"
NAMESPACE = ""  # your namespace id

client = nacos.NacosClient(SERVER_ADDRESSES, namespace=NAMESPACE)

# Get config
data_id = "${dataId}"
group = "${group}"
config = client.get_config(data_id, group)
print(config)

# Listen for changes
def config_changed(args):
    print("Config changed:", args["content"])

client.add_config_watcher(data_id, group, config_changed)`

    case 'go':
      return `package main

import (
    "fmt"
    "github.com/nacos-group/nacos-sdk-go/v2/clients"
    "github.com/nacos-group/nacos-sdk-go/v2/common/constant"
    "github.com/nacos-group/nacos-sdk-go/v2/vo"
)

func main() {
    sc := []constant.ServerConfig{
        *constant.NewServerConfig("localhost", 8848),
    }
    cc := constant.NewClientConfig(
        constant.WithNamespaceId(""),
    )

    client, _ := clients.NewConfigClient(
        vo.NacosClientParam{
            ClientConfig:  cc,
            ServerConfigs: sc,
        },
    )

    // Get config
    content, _ := client.GetConfig(vo.ConfigParam{
        DataId: "${dataId}",
        Group:  "${group}",
    })
    fmt.Println(content)

    // Listen for changes
    client.ListenConfig(vo.ConfigParam{
        DataId: "${dataId}",
        Group:  "${group}",
        OnChange: func(namespace, group, dataId, data string) {
            fmt.Println("Config changed:", data)
        },
    })
}`

    case 'shell':
      return `# Get config
curl -X GET 'http://localhost:8848/nacos/v2/cs/config?dataId=${dataId}&group=${group}&namespaceId='

# Publish config
curl -X POST 'http://localhost:8848/nacos/v2/cs/config' \\
  -d 'dataId=${dataId}' \\
  -d 'group=${group}' \\
  -d 'content=your-config-content' \\
  -d 'type=text'

# Delete config
curl -X DELETE 'http://localhost:8848/nacos/v2/cs/config?dataId=${dataId}&group=${group}'`

    default:
      return ''
  }
}

function getServiceCode(tab: string): string {
  const serviceName = props.dataId
  const group = props.groupName

  switch (tab) {
    case 'java':
      return `import com.alibaba.nacos.api.NacosFactory;
import com.alibaba.nacos.api.naming.NamingService;
import com.alibaba.nacos.api.naming.pojo.Instance;
import java.util.Properties;

Properties properties = new Properties();
properties.put("serverAddr", "localhost:8848");
// properties.put("namespace", "your-namespace-id");

NamingService namingService = NacosFactory.createNamingService(properties);

// Register instance
namingService.registerInstance("${serviceName}", "${group}", "127.0.0.1", 8080);

// Discover instances
List<Instance> instances = namingService.getAllInstances("${serviceName}", "${group}");
for (Instance instance : instances) {
    System.out.println(instance.getIp() + ":" + instance.getPort());
}

// Subscribe to changes
namingService.subscribe("${serviceName}", "${group}", event -> {
    System.out.println("Service instances changed: " + event);
});`

    case 'springboot':
      return `# application.properties
spring.cloud.nacos.discovery.server-addr=localhost:8848
spring.cloud.nacos.discovery.namespace=
spring.cloud.nacos.discovery.group=${group}
spring.application.name=${serviceName}

# pom.xml dependency
# <dependency>
#     <groupId>com.alibaba.cloud</groupId>
#     <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
# </dependency>

// Enable discovery
@EnableDiscoveryClient
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

// Use RestTemplate with LoadBalancer
@LoadBalanced
@Bean
public RestTemplate restTemplate() {
    return new RestTemplate();
}

// Call service
String result = restTemplate.getForObject("http://${serviceName}/api/endpoint", String.class);`

    case 'python':
      return `import nacos

SERVER_ADDRESSES = "localhost:8848"
NAMESPACE = ""

client = nacos.NacosClient(SERVER_ADDRESSES, namespace=NAMESPACE)

# Register instance
client.add_naming_instance("${serviceName}", "127.0.0.1", 8080, group_name="${group}")

# Discover instances
instances = client.list_naming_instance("${serviceName}", group_name="${group}")
for host in instances["hosts"]:
    print(f"{host['ip']}:{host['port']}")

# Deregister
client.remove_naming_instance("${serviceName}", "127.0.0.1", 8080, group_name="${group}")`

    case 'go':
      return `package main

import (
    "fmt"
    "github.com/nacos-group/nacos-sdk-go/v2/clients"
    "github.com/nacos-group/nacos-sdk-go/v2/common/constant"
    "github.com/nacos-group/nacos-sdk-go/v2/vo"
)

func main() {
    sc := []constant.ServerConfig{
        *constant.NewServerConfig("localhost", 8848),
    }
    cc := constant.NewClientConfig(
        constant.WithNamespaceId(""),
    )

    client, _ := clients.NewNamingClient(
        vo.NacosClientParam{
            ClientConfig:  cc,
            ServerConfigs: sc,
        },
    )

    // Register instance
    client.RegisterInstance(vo.RegisterInstanceParam{
        Ip:          "127.0.0.1",
        Port:        8080,
        ServiceName: "${serviceName}",
        GroupName:   "${group}",
        Enable:      true,
        Healthy:     true,
        Ephemeral:   true,
    })

    // Discover instances
    instances, _ := client.SelectAllInstances(vo.SelectAllInstancesParam{
        ServiceName: "${serviceName}",
        GroupName:   "${group}",
    })
    for _, inst := range instances {
        fmt.Printf("%s:%d\\n", inst.Ip, inst.Port)
    }
}`

    case 'shell':
      return `# Register instance
curl -X POST 'http://localhost:8848/nacos/v2/ns/instance' \\
  -d 'serviceName=${serviceName}' \\
  -d 'groupName=${group}' \\
  -d 'ip=127.0.0.1' \\
  -d 'port=8080'

# Discover instances
curl -X GET 'http://localhost:8848/nacos/v2/ns/instance/list?serviceName=${serviceName}&groupName=${group}'

# Deregister instance
curl -X DELETE 'http://localhost:8848/nacos/v2/ns/instance?serviceName=${serviceName}&groupName=${group}&ip=127.0.0.1&port=8080'`

    default:
      return ''
  }
}

const close = () => {
  emit('update:modelValue', false)
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(currentCode.value)
  } catch (error) {
    logger.error('Failed to copy code:', error)
  }
}
</script>
