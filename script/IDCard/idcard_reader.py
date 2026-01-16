import ctypes
import os
import time
import json
import base64
import socket
import sys
from ctypes import c_char_p, c_int, POINTER, byref
from io import BytesIO
from threading import Thread, Lock


try:
    from PIL import Image
except ImportError:
    # 先定义临时send_json避免未定义错误
    def send_json(data_type, content):
        print(json.dumps({
            "type": data_type,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "content": content
        }, ensure_ascii=True), flush=True)
    send_json("fatal_error", "缺失PIL库，请移植PIL文件夹到Python的site-packages")
    exit(1)

# ===================== 核心：统一JSON输出方法 =====================
def send_json(data_type: str, content: any, ensure_ascii: bool = False, indent: int = None):
    """
    统一JSON输出方法，支持全局调整编码和格式
    :param data_type: 消息类型（success/error/warn/debug/status/fatal_error）
    :param content: 消息内容（任意可序列化对象）
    :param ensure_ascii: 是否确保ASCII编码（False=支持中文）
    :param indent: 格式化缩进（None=紧凑模式，2=易读模式）
    """
    try:
        # 标准化消息结构
        message = {
            "type": data_type,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "content": content
        }
        # 统一JSON序列化配置
        json_str = json.dumps(message, ensure_ascii=True)
        # 强制刷新输出（确保Electron能实时接收）
        print(json_str, flush=True)
    except Exception as e:
        # 序列化失败时的兜底输出
        error_msg = json.dumps({
            "type": "json_error",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "content": f"JSON序列化失败：{str(e)}，原始内容：{str(content)}"
        }, ensure_ascii=True)
        print(error_msg, flush=True)

# ===================== 【新增】Socket测试工具类（无硬件依赖） =====================
class SocketTestServer:
    """纯Socket测试服务端，跳过读卡器硬件，仅验证通信"""
    def __init__(self, host: str = "127.0.0.1", port: int = 9999):
        self.host = host
        self.port = port
        self.server = None
        self.is_running = True
        self.clients = []  # 存储已连接的客户端
        self.clients_lock = Lock()  # 客户端列表锁
        # 模拟身份证数据（固定测试用）
        self.test_card_data = {
            "name": "测试姓名",
            "gender": "男",
            "nation": "汉",
            "birthDate": "19900101",
            "address": "测试省测试市测试区测试路1号",
            "idNumber": "110101199001011234",
            "issuingAuthority": "测试公安局",
            "validFrom": "20200101",
            "validTo": "20300101",
            "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/APrIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi//Z"
        }

    def start(self):
        """启动纯Socket测试服务（移除心跳检测）"""
        # 创建Socket服务
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        self.server.bind((self.host, self.port))
        self.server.listen(10)
        self.is_running = True

        send_json("status", f"【Socket测试模式】服务已启动，监听 {self.host}:{self.port}")
        send_json("debug", "当前为纯Socket测试模式，跳过读卡器硬件依赖")

        # 启动测试数据轮询线程（独立于客户端连接）
        test_poll_thread = Thread(target=self.test_card_poll)
        test_poll_thread.daemon = True
        test_poll_thread.start()

        # 监听客户端连接
        while self.is_running:
            try:
                conn, addr = self.server.accept()
                send_json("status", f"【Socket测试模式】客户端已连接：{addr}")
                with self.clients_lock:
                    self.clients.append(conn)
            except Exception as e:
                if self.is_running:
                    send_json("error", f"【Socket测试模式】服务端异常：{str(e)}")
                break

    def test_card_poll(self):
        """独立线程：模拟读卡器持续轮询卡片"""
        count = 0
        while self.is_running:
            count += 1
            # 模拟等待刷卡状态
            send_json("status", "【Socket测试模式】等待刷卡...")
            self.broadcast_to_clients({
                "type": "status",
                "content": "【Socket测试模式】等待刷卡..."
            })

            # 每3秒发送一次模拟刷卡数据
            time.sleep(3)
            send_json("success", f"【Socket测试模式】第{count}次模拟刷卡数据")
            # 广播测试数据到所有客户端
            self.broadcast_to_clients({
                "type": "success",
                "content": self.test_card_data,
                "test_count": count
            })

    def broadcast_to_clients(self, data: dict):
        """广播数据到所有已连接的客户端（被动检测断开）"""
        try:
            data_str = json.dumps(data, ensure_ascii=False).encode("utf-8") + b"\n"
            with self.clients_lock:
                valid_clients = []
                for conn in self.clients:
                    try:
                        conn.sendall(data_str)
                        valid_clients.append(conn)
                    except Exception as e:
                        send_json("warn", f"【Socket测试模式】客户端断开：{str(e)}")
                self.clients = valid_clients
        except Exception as e:
            send_json("error", f"【Socket测试模式】广播数据失败：{str(e)}")

    def stop(self):
        """停止测试服务"""
        self.is_running = False
        # 关闭所有客户端连接
        with self.clients_lock:
            for conn in self.clients:
                try:
                    conn.close()
                except:
                    pass
            self.clients = []
        if self.server:
            self.server.close()
        send_json("status", "【Socket测试模式】服务已停止")

# ===================== 读卡器核心类（保留原有逻辑） =====================
class IDCardReader:
    def __init__(self):
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.zp_bmp_path = os.path.join(self.script_dir, "zp.bmp")
        self.wx_txt_path = os.path.join(self.script_dir, "wx.txt")
        self.load_dlls()
        self.define_function_types()
        self.is_running = True
        self.last_card_info = None  # 存储最新读卡数据
        self.card_lock = Lock()     # 读卡数据锁
        # 调试信息：输出初始化路径
        send_json("debug", {
            "script_dir": self.script_dir,
            "zp_bmp_path": self.zp_bmp_path
        })

    def load_dlls(self):
        """加载SDK动态库"""
        try:
            self.termb_dll = ctypes.WinDLL(os.path.join(self.script_dir, "Termb.dll"))
            self.sdtapi_dll = ctypes.WinDLL(os.path.join(self.script_dir, "sdtapi.dll"))
        except Exception as e:
            raise RuntimeError(f"加载DLL失败：{str(e)}")

    def define_function_types(self):
        """定义SDK函数类型"""
        self.termb_dll.CVR_InitComm.argtypes = (c_int,)
        self.termb_dll.CVR_InitComm.restype = c_int
        self.termb_dll.CVR_Authenticate.argtypes = ()
        self.termb_dll.CVR_Authenticate.restype = c_int
        self.termb_dll.CVR_Read_FPContent.argtypes = ()
        self.termb_dll.CVR_Read_FPContent.restype = c_int
        self.termb_dll.CVR_CloseComm.argtypes = ()
        self.termb_dll.CVR_CloseComm.restype = c_int

        # 单项信息提取函数定义
        self.termb_dll.GetPeopleName.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleName.restype = c_int
        self.termb_dll.GetPeopleSex.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleSex.restype = c_int
        self.termb_dll.GetPeopleNation.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleNation.restype = c_int
        self.termb_dll.GetPeopleBirthday.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleBirthday.restype = c_int
        self.termb_dll.GetPeopleAddress.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleAddress.restype = c_int
        self.termb_dll.GetPeopleIDCode.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleIDCode.restype = c_int
        self.termb_dll.GetDepartment.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetDepartment.restype = c_int
        self.termb_dll.GetStartDate.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetStartDate.restype = c_int
        self.termb_dll.GetEndDate.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetEndDate.restype = c_int

    def init_comm(self, port: int = 1001) -> bool:
        """初始化读卡器"""
        ret_code = self.termb_dll.CVR_InitComm(port)
        result = ret_code == 1
        if not result:
            send_json("error", f"读卡器初始化失败（端口：{port}），SDK返回码：{ret_code}")
        else:
            send_json("success", f"读卡器初始化成功（端口：{port}），SDK返回码：{ret_code}")
        return result

    def wait_for_card(self) -> bool:
        """持续等待刷卡（无超时，增加心跳日志）"""
        wait_seconds = 0  # 累计等待秒数
        send_json("status", "等待刷卡...（无超时，放卡后自动识别）")

        while self.is_running:  # 绑定进程运行状态，停止进程时退出
            ret_code = self.termb_dll.CVR_Authenticate()

            # 检测到卡片，立即返回
            if ret_code == 1:
                send_json("success", f"检测到身份证卡片，认证成功（累计等待{wait_seconds}秒）")
                return True

            # 每5秒打印一次心跳日志（避免刷屏）
            if wait_seconds % 5 == 0:
                send_json("debug", f"等待刷卡中...当前认证返回码：{ret_code}，已等待{wait_seconds}秒")

            wait_seconds += 0.1  # 累计等待时间
            time.sleep(0.1)  # 降低CPU占用

        # 进程停止时退出
        send_json("warn", "读卡器服务已停止，终止等待刷卡")
        return False

    def read_card_data(self) -> dict:
        """读取卡片数据（含照片）"""
        # 执行读卡
        result = self.termb_dll.CVR_Read_FPContent()
        if result != 1:
            raise RuntimeError(f"读卡失败，SDK返回码：{result}")

        # 等待照片生成（最多1秒，10次检查）
        zp_bmp_exists = False
        for retry_count in range(10):
            if os.path.exists(self.zp_bmp_path):
                zp_bmp_exists = True
                break
            time.sleep(0.2)
            # 调试输出重试状态
            send_json("debug", {
                "action": "photo_check",
                "retry_count": retry_count + 1,
                "zp_bmp_exists": os.path.exists(self.zp_bmp_path),
                "zp_bmp_path": self.zp_bmp_path
            })

        # 打印文件状态
        send_json("file_status", {
            "wz_txt_exists": os.path.exists(os.path.join(self.script_dir, "wz.txt")),
            "zp_bmp_exists": zp_bmp_exists,
            "zp_bmp_size": os.path.getsize(self.zp_bmp_path) if zp_bmp_exists else 0
        })

        return {
            "zp_bmp_exists": zp_bmp_exists
        }

    def bmp_to_base64(self) -> str | None:
        """转换照片为Base64（容错处理）"""
        if not os.path.exists(self.zp_bmp_path):
            send_json("warn", "未找到zp.bmp照片文件")
            return None

        try:
            with Image.open(self.zp_bmp_path) as img:
                img = img.convert("RGB")
                buffer = BytesIO()
                img.save(buffer, format="JPEG", quality=90)
                buffer.seek(0)
                b64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")
                photo_base64 = f"data:image/jpeg;base64,{b64_data}"

                # 清理临时文件
                os.remove(self.zp_bmp_path)
                send_json("debug", "zp.bmp照片转换完成并删除临时文件")
                return photo_base64
        except Exception as e:
            send_json("photo_error", f"照片转换失败：{str(e)}")
            return None

    def get_single_info(self, func, max_len: int = 100) -> str:
        """提取单项身份证信息"""
        buf = ctypes.create_string_buffer(max_len)
        buf_len = c_int(max_len)
        if func(buf, byref(buf_len)) == 1:
            return buf.value.decode("gbk").strip("\x00")
        return ""

    def get_card_info(self) -> dict:
        """提取完整身份证信息"""
        return {
            "name": self.get_single_info(self.termb_dll.GetPeopleName, 30),
            "gender": self.get_single_info(self.termb_dll.GetPeopleSex, 2),
            "nation": self.get_single_info(self.termb_dll.GetPeopleNation, 20),
            "birthDate": self.get_single_info(self.termb_dll.GetPeopleBirthday, 16),
            "address": self.get_single_info(self.termb_dll.GetPeopleAddress, 70),
            "idNumber": self.get_single_info(self.termb_dll.GetPeopleIDCode, 36),
            "issuingAuthority": self.get_single_info(self.termb_dll.GetDepartment, 30),
            "validFrom": self.get_single_info(self.termb_dll.GetStartDate, 16),
            "validTo": self.get_single_info(self.termb_dll.GetEndDate, 16),
            "photoBase64": self.bmp_to_base64()
        }

    def close(self):
        """关闭读卡器，清理资源"""
        self.termb_dll.CVR_CloseComm()
        self.is_running = False
        # 清理残留文件
        for file_path in [self.zp_bmp_path, self.wx_txt_path]:
            if os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except Exception as e:
                    send_json("warn", f"清理临时文件失败 {file_path}：{str(e)}")
        send_json("status", "读卡器已关闭，临时文件清理完成")

# ===================== Socket服务端（与读卡器解耦） =====================
class CardReaderServer:
    def __init__(self, host: str = "127.0.0.1", port: int = 9999):
        self.host = host
        self.port = port
        self.reader = IDCardReader()
        self.server = None
        self.is_running = False
        self.clients = []          # 存储已连接的客户端
        self.clients_lock = Lock() # 客户端列表锁

    def start(self):
        """启动服务：读卡器独立轮询 + Socket监听（移除心跳检测）"""
        # 初始化读卡器（仅启动时执行一次）
        if not self.reader.init_comm():
            send_json("fatal_error", "读卡器初始化失败，服务启动终止")
            return

        # 标记服务运行状态
        self.is_running = True
        send_json("status", f"读卡器初始化成功，已进入就绪状态")

        # 启动读卡器独立轮询线程（核心！与Socket解耦）
        reader_poll_thread = Thread(target=self.reader_continuous_poll)
        reader_poll_thread.daemon = True
        reader_poll_thread.start()

        # 创建Socket服务（优化配置）
        self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)  # 禁用Nagle算法
        self.server.bind((self.host, self.port))
        self.server.listen(10)  # 增大监听队列
        send_json("status", f"Socket服务已启动，监听 {self.host}:{self.port}")

        # 监听客户端连接（独立于读卡器轮询）
        while self.is_running:
            try:
                conn, addr = self.server.accept()
                send_json("status", f"客户端已连接：{addr}，读卡器持续轮询中")
                # 加锁添加客户端（仅添加，不启动心跳检测）
                with self.clients_lock:
                    self.clients.append(conn)
            except Exception as e:
                if self.is_running:
                    send_json("error", f"Socket服务端异常：{str(e)}")
                break

    def reader_continuous_poll(self):
        """核心：读卡器独立轮询线程（不依赖Socket客户端）"""
        send_json("status", "读卡器开始独立轮询卡片（不受Socket连接影响）")
        while self.is_running:
            try:
                # 持续等待刷卡（无客户端也会轮询）
                card_detected = self.reader.wait_for_card()
                if not self.is_running:
                    break
                if not card_detected:
                    continue

                # 读取卡片数据
                send_json("status", "检测到身份证，正在读取数据...")
                self.reader.read_card_data()
                card_info = self.reader.get_card_info()

                # 存储最新读卡数据
                with self.reader.card_lock:
                    self.reader.last_card_info = card_info

                # 广播数据到所有已连接的客户端
                send_json("success", "读取到身份证数据，广播到所有客户端")
                self.broadcast_to_clients({
                    "type": "success",
                    "content": card_info
                })

                # 短暂延迟，避免重复读取
                time.sleep(1)

            except RuntimeError as e:
                error_msg = str(e)
                send_json("error", error_msg)
                self.broadcast_to_clients({
                    "type": "error",
                    "content": error_msg
                })
            except Exception as e:
                error_msg = f"读卡器轮询异常：{str(e)}"
                send_json("error", error_msg)
                self.broadcast_to_clients({
                    "type": "error",
                    "content": error_msg
                })

    def broadcast_to_clients(self, data: dict):
        """广播数据到所有已连接的客户端（被动检测断开）"""
        try:
            # 序列化数据（确保中文正常）
            data_str = json.dumps(data, ensure_ascii=False).encode("utf-8") + b"\n"
            # 加锁操作客户端列表
            with self.clients_lock:
                valid_clients = []
                for conn in self.clients:
                    try:
                        # 发送数据（仅在发送失败时判定客户端断开）
                        conn.sendall(data_str)
                        valid_clients.append(conn)  # 发送成功=客户端存活
                    except Exception as e:
                        # 发送失败=客户端断开，记录日志但不抛出异常
                        send_json("warn", f"客户端发送数据失败（已断开）：{str(e)}")
                # 仅保留发送成功的客户端
                self.clients = valid_clients
        except Exception as e:
            send_json("error", f"广播数据到客户端失败：{str(e)}")

    def stop(self):
        """停止服务（仅在软件关闭时调用）"""
        # 标记服务停止
        self.is_running = False

        # 关闭所有客户端连接
        with self.clients_lock:
            for conn in self.clients:
                try:
                    conn.close()
                except:
                    pass
            self.clients = []

        # 关闭Socket服务
        if self.server:
            self.server.close()
            send_json("status", "Socket服务已关闭")

        # 关闭读卡器（仅此处关闭）
        self.reader.close()
        send_json("status", "读卡器服务已停止（软件退出）")


# ===================== 主函数 =====================
def main():
    """程序入口：支持命令行参数切换测试模式"""
    # 解析命令行参数
    if len(sys.argv) > 1 and sys.argv[1] == "--socket-test":
        # 启动纯Socket测试模式
        send_json("info", "启动纯Socket测试模式，跳过读卡器硬件")
        test_server = SocketTestServer()
        try:
            test_server.start()
        except KeyboardInterrupt:
            send_json("status", "【Socket测试模式】接收到终止指令，正在停止服务...")
        finally:
            test_server.stop()
    else:
        # 启动正常读卡器模式
        send_json("info", "启动正常读卡器模式（读卡器独立轮询）")
        server = CardReaderServer()
        try:
            server.start()
        except KeyboardInterrupt:
            send_json("status", "接收到终止指令，正在停止服务...")
        finally:
            server.stop()

if __name__ == "__main__":
    main()