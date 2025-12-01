import ctypes
import os
import time
import json
from ctypes import c_char_p, c_int, POINTER, byref


class IDCardReader:
    def __init__(self):
        """初始化：加载SDK动态库并定义函数参数/返回值类型"""
        self.load_dlls()
        self.define_function_types()
        self.temp_dir = os.path.join(os.environ["USERPROFILE"], "AppData", "Local", "Temp", "chinaidcard")
        # print(f"系统临时目录（读卡生成文件路径）：{self.temp_dir}")

    def load_dlls(self):
        """加载SDK核心动态库"""
        dir_path = os.path.dirname(os.path.abspath(__file__))
#         path = os.path.join(dir_path, "WltRs.dll")
#         send_message("log", f"路径:{path}")
        try:
            # 加载API函数库、安全模块库、照片解码库
            self.termb_dll = ctypes.WinDLL(os.path.join(dir_path, "Termb.dll"))
            self.sdtapi_dll = ctypes.WinDLL(os.path.join(dir_path, "sdtapi.dll"))
            self.wltrs_dll = ctypes.WinDLL(os.path.join(dir_path, "WltRs.dll"))
            # print("动态库加载成功")
        except Exception as e:
            raise RuntimeError(f"动态库加载失败：{str(e)}，请检查库文件路径及版本匹配")

    def define_function_types(self):
        """定义SDK函数的参数类型和返回值类型（C语言与Python数据交互适配）"""
        # 1. 核心流程函数
        # 初始化连接：CVR_InitComm(int Port) -> 返回int
        self.termb_dll.CVR_InitComm.argtypes = (c_int,)
        self.termb_dll.CVR_InitComm.restype = c_int

        # 卡认证：CVR_Authenticate() -> 返回int
        self.termb_dll.CVR_Authenticate.argtypes = ()
        self.termb_dll.CVR_Authenticate.restype = c_int

        # 读卡操作1（无指纹）：CVR_Read_Content(int active) -> 返回int
        self.termb_dll.CVR_Read_Content.argtypes = (c_int,)
        self.termb_dll.CVR_Read_Content.restype = c_int

        # 读卡操作2（含指纹）：CVR_Read_FPContent() -> 返回int
        self.termb_dll.CVR_Read_FPContent.argtypes = ()
        self.termb_dll.CVR_Read_FPContent.restype = c_int

        # 关闭连接：CVR_CloseComm() -> 返回int
        self.termb_dll.CVR_CloseComm.argtypes = ()
        self.termb_dll.CVR_CloseComm.restype = c_int

        # 获取安全模块号：CVR_GetSAMID(char *SAMID) -> 返回int
        self.termb_dll.CVR_GetSAMID.argtypes = (c_char_p,)
        self.termb_dll.CVR_GetSAMID.restype = c_int

        # 2. 单项信息提取函数（多字节版本）
        # 姓名：GetPeopleName(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetPeopleName.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleName.restype = c_int

        # 性别：GetPeopleSex(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetPeopleSex.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleSex.restype = c_int

        # 民族/国籍：GetPeopleNation(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetPeopleNation.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleNation.restype = c_int

        # 出生日期：GetPeopleBirthday(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetPeopleBirthday.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleBirthday.restype = c_int

        # 地址：GetPeopleAddress(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetPeopleAddress.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleAddress.restype = c_int

        # 证件号：GetPeopleIDCode(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetPeopleIDCode.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetPeopleIDCode.restype = c_int

        # 签发机关：GetDepartment(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetDepartment.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetDepartment.restype = c_int

        # 有效期起始：GetStartDate(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetStartDate.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetStartDate.restype = c_int

        # 有效期终止：GetEndDate(char *strTmp, int *strLen) -> 返回int
        self.termb_dll.GetEndDate.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetEndDate.restype = c_int

        # 指纹数据：GetFPDate(unsigned char *pData, int *pLen) -> 返回int
        self.termb_dll.GetFPDate.argtypes = (POINTER(c_int), POINTER(c_int))
        self.termb_dll.GetFPDate.restype = c_int

        # 证件类别：GetCertType(unsigned char *nationData, int *pLen) -> 返回int
        self.termb_dll.GetCertType.argtypes = (c_char_p, POINTER(c_int))
        self.termb_dll.GetCertType.restype = c_int

    def init_comm(self, port):
        """
        初始化设备连接
        :param port: 端口号（串口1-16，USB口1001-1016）
        :return: 成功返回True，失败抛出异常
        """
        result = self.termb_dll.CVR_InitComm(port)
        if result == 1:
            # print(f"端口{port}初始化成功")
            return True
        else:
            return False
        # elif result == 2:
        #     raise ConnectionError(f"端口{port}打开失败，请检查设备连接")
        # elif result == -1:
        #     raise RuntimeError(f"端口{port}初始化未知错误")
        # elif result == -2:
        #     raise RuntimeError("动态库加载失败")
        # else:
        #     raise RuntimeError(f"初始化失败，返回码：{result}")

    def authenticate_card(self):
        """
        卡认证（内部调用找卡+选卡）
        :return: 成功返回True，失败抛出异常
        """
        # 卡认证循环间隔>300ms，重试3次
        for _ in range(3):
            result = self.termb_dll.CVR_Authenticate()
            if result == 1:
                return True
            time.sleep(0.5)  # 间隔>300ms
        raise RuntimeError("卡认证失败，请移走卡片重新放置（避免金属保护套干扰）")

    def read_content(self, read_fp=False, active=1):
        """
        读卡操作
        :param read_fp: 是否读取指纹（True用CVR_Read_FPContent，False用CVR_Read_Content）
        :param active: 非指纹读卡时的文件种类（1:wz.txt+xp.wlt+zp.bmp+fp.dat；2:wz.txt+xp.wlt+fp.dat；4:wz.txt+zp.bmp+fp.dat）
        :return: 成功返回True，失败抛出异常
        """
        if read_fp:
            # 读取含指纹信息（生成文件到当前运行目录）
            result = self.termb_dll.CVR_Read_FPContent()
            # print("已调用含指纹读卡函数，文件生成到当前运行目录")
        else:
            # 读取不含指纹信息（生成文件到系统临时目录）
            result = self.termb_dll.CVR_Read_Content(active)
            # print(f"已调用普通读卡函数（active={active}），文件生成到系统临时目录")

        if result == 1:
            return True
        elif result == 0:
            raise RuntimeError("读身份证失败，请检查卡片有效性")
        elif result == 4:
            raise ConnectionError("身份证读卡器未连接")
        elif result == 99:
            raise RuntimeError("动态库未加载")
        else:
            raise RuntimeError(f"读卡失败，返回码：{result}（检查授权.dat文件是否存在）")

    def get_single_info(self, func, max_len=100):
        """
        提取单项信息（通用函数）
        :param func: SDK信息提取函数（如GetPeopleName）
        :param max_len: 缓冲区最大长度
        :return: 提取的信息（字符串）
        """
        buf = ctypes.create_string_buffer(max_len)
        buf_len = c_int(max_len)
        result = func(buf, byref(buf_len))
        if result == 1:
            # 解码为UTF-8字符串（去除空字符）
            return buf.value.decode("gbk").strip('\x00')
        else:
            return "未获取到信息"

    def get_id_card_info(self):
        """提取完整身份证信息（优化字段命名为英文，便于前端处理）"""
        cert_type = self.get_single_info(self.termb_dll.GetCertType, 10)

        # 基础信息提取（使用英文键名，便于前端绑定）
        info = {
            "name": self.get_single_info(self.termb_dll.GetPeopleName, 30),
            "gender": self.get_single_info(self.termb_dll.GetPeopleSex, 2),
            "nation": self.get_single_info(self.termb_dll.GetPeopleNation, 20),
            "birthDate": self.get_single_info(self.termb_dll.GetPeopleBirthday, 16),
            "address": self.get_single_info(self.termb_dll.GetPeopleAddress, 70),
            "idNumber": self.get_single_info(self.termb_dll.GetPeopleIDCode, 36),
            "issuingAuthority": self.get_single_info(self.termb_dll.GetDepartment, 30),
            "validFrom": self.get_single_info(self.termb_dll.GetStartDate, 16),
            "validTo": self.get_single_info(self.termb_dll.GetEndDate, 16),
            "certType": cert_type  # 证件类型：空=身份证，I=外国人永居证，J=港澳台居住证
        }

        # 补充证件类型特有信息
        if cert_type == "J":
            info["passportNumber"] = "待扩展"  # 通行证号码
            info["issueCount"] = "待扩展"  # 签发次数
        elif cert_type == "I":
            info["chineseName"] = "待扩展"  # 中文姓名
            info["certVersion"] = "待扩展"  # 证件版本号

        # 指纹数据检测
        fp_buf = (c_int * 1024)()
        fp_len = c_int(1024)
        fp_result = self.termb_dll.GetFPDate(fp_buf, byref(fp_len))
        info["hasFingerprint"] = fp_result == 1 and any(fp_buf)

        return info

    def close_comm(self):
        """关闭设备连接"""
        result = self.termb_dll.CVR_CloseComm()
        # if result == 1:
        #     send_message("status","连接关闭成功，释放系统资源")
        # elif result == 0:
        #     send_message("status","关闭连接失败：端口号不合法")
        # elif result == -1:
        #     send_message("status","关闭连接失败：端口已关闭")
        # elif result == -2:
        #     send_message("status","关闭连接失败：动态库未加载")
        return result == 1


# 统一输出格式生成函数
def send_message(data_type, content):
    """生成标准化消息格式"""
    message = {
        "type": data_type,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "content": content
    }
    print(json.dumps(message, ensure_ascii=True), flush=True)  # flush确保实时输出


def main():
    """主函数：优化输出格式，增加状态码和时间戳"""
    reader = None
    try:
        # 1. 初始化阅读器
        # send_message("status", "初始化身份证读卡器...")
        reader = IDCardReader()

        flag = reader.init_comm(port=1001)  # USB端口
        # send_message("status", "读卡器初始化成功，请放置身份证")

        # 2. 循环等待读卡
        while flag:
            try:
                # 卡认证
                reader.authenticate_card()
                # send_message("status", "检测到卡片，正在读取信息...")

                # 读卡并提取信息
                reader.read_content(read_fp=False, active=1)
                card_info = reader.get_id_card_info()

                # 发送身份证信息（带成功状态）
                send_message("success", {
                    "message": "身份证信息读取成功",
                    "data": card_info
                })

                # 等待下一张卡
                time.sleep(2)
                # send_message("status", "请放置下一张身份证（按Ctrl+C停止）")

            except Exception as e:
                # 发送错误信息（带错误详情）
                send_message("card_error", {
                    "message": "读卡失败",
                    "detail": str(e),
                    "retry": True
                })
                time.sleep(2)

    except Exception as e:
        send_message("close", {"message": str(e)})
    finally:
        if reader:
            reader.close_comm()
        send_message("close", {"message": "关闭读卡器"})


if __name__ == "__main__":
    main()
