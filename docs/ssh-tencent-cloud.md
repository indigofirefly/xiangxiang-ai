# SSH 登录腾讯云 Ubuntu 服务器备忘录

> 服务器：腾讯云 Ubuntu ｜ 公网 IP：`115.159.68.194`
> 整理日期：2026-11-20

## 1. 登录服务器

```bash
ssh root@115.159.68.194
```

或使用 Ubuntu 默认用户：

```bash
ssh ubuntu@115.159.68.194
```

使用指定密钥登录：

```bash
ssh -i ~/.ssh/id_ed25519 root@115.159.68.194
```

- 首次连接会提示 `The authenticity of host ... can't be established`，输入 `yes` 回车
- 密码输入时不显示，正常现象

## 2. 创建 deploy 用户（正式部署用）

以 root 或 ubuntu 登录服务器后执行：

```bash
sudo adduser deploy
```

按提示设置密码，姓名等信息可一路回车。

加入 sudo 组：

```bash
sudo usermod -aG sudo deploy
```

验证：

```bash
su - deploy
sudo whoami
exit
```

输出 `root` 表示 sudo 权限正常。

> 注意：`usermod` 的 `-a` 参数不能漏，漏掉会覆盖用户原有组。

## 3. 给 deploy 配置 SSH 密钥（免密登录）

本地已有密钥 `~/.ssh/id_ed25519`，直接上传公钥：

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@115.159.68.194
```

输入 deploy 的密码后，验证免密登录：

```bash
ssh deploy@115.159.68.194
```

服务器上手动配置（`ssh-copy-id` 不可用时）：

```bash
# 本地：查看公钥
cat ~/.ssh/id_ed25519.pub
```

```bash
# 服务器：粘贴公钥
mkdir -p ~/.ssh
echo '<粘贴公钥内容>' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

## 4. 本地配置别名，简化登录

在本地 `~/.ssh/config` 末尾追加：

```sshconfig
Host tencent
    HostName 115.159.68.194
    User deploy
    IdentityFile ~/.ssh/id_ed25519
```

之后直接：

```bash
ssh tencent
```

## 5. 可选加固（确认 deploy 能免密登录后再做）

```bash
sudo vim /etc/ssh/sshd_config
```

- `PermitRootLogin no` — 禁止 root 直接登录
- `PasswordAuthentication no` — 仅允许密钥登录

```bash
sudo systemctl restart ssh
```

> ⚠️ 操作时保留一个已登录的终端窗口不要关闭，防止配置错误把自己锁在外面。

## 6. 部署相关

给 deploy 用户 Docker 权限（服务器安装的是 Docker CE 时）：

```bash
sudo usermod -aG docker deploy
```

重新登录后生效。

部署时把 `docker-compose.production.yml` 与 `.env.production` 放在服务器的同一项目目录下，用 deploy 用户执行：

```bash
docker compose -f docker-compose.production.yml up -d --build
```

## 7. 常见排错

| 现象 | 原因 / 处理 |
|------|-------------|
| `Permission denied (publickey)` | 检查服务器 `~/.ssh` 权限为 700、`authorized_keys` 为 600，家目录不能是 777 |
| 连接超时 | 腾讯云控制台安全组是否放行 22 端口、来源 IP 是否受限 |
| 首次连接指纹提示 | 输入 `yes`；记录保存在 `~/.ssh/known_hosts` |
| deploy 无法 sudo | 确认已执行 `usermod -aG sudo deploy`，并重新登录 |
| 改了 sshd 配置后连不上 | 从腾讯云控制台 VNC 登录，改回 `/etc/ssh/sshd_config` 并重启 ssh |

> 若本文档要提交到公开仓库，建议把公网 IP 替换为占位符。
