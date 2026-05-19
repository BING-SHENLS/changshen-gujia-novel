# 这是一个独立的 Hashids 最小化实现，不需要安装任何库
import math

class SimpleHashids:
    def __init__(self, salt="", min_length=0, alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"):
        self.salt = salt
        self.min_length = min_length
        self.alphabet = alphabet
        self.seps = "cfhistuCFHISTU"
        self.guards = "3789" # default guards

        self.alphabet = "".join([c for c in self.alphabet if c not in self.seps])
        self.alphabet = "".join([c for c in self.alphabet if c not in self.guards])
        
        self.seps = self.consistent_shuffle(self.seps, self.salt)

        if not self.seps or (len(self.alphabet) / len(self.seps)) > 3.5:
            seps_len = math.ceil(len(self.alphabet) / 3.5)
            if seps_len > len(self.seps):
                diff = seps_len - len(self.seps)
                self.seps += self.alphabet[:diff]
                self.alphabet = self.alphabet[diff:]
            else:
                self.seps = self.seps[:seps_len]

        self.alphabet = self.consistent_shuffle(self.alphabet, self.salt)
        
    def consistent_shuffle(self, alphabet, salt):
        if not salt:
            return alphabet
        
        as_list = list(alphabet)
        salt_len = len(salt)
        v = 0
        p = 0
        
        for i in range(len(as_list) - 1, 0, -1):
            v = (v * salt_len + ord(salt[p % salt_len]) + p) % i
            p += 1
            # swap
            as_list[i], as_list[v] = as_list[v], as_list[i]
            
        return "".join(as_list)

    def hash(self, input_val):
        # 简化版 hash，只针对单个整数
        return self._encode([input_val])

    def _encode(self, numbers):
        ret = ""
        alphabet = self.alphabet
        
        numbers_hash_int = 0
        for i, number in enumerate(numbers):
            numbers_hash_int += (number % (i + 100))
        
        lottery = ret = alphabet[numbers_hash_int % len(alphabet)]
        
        for i, number in enumerate(numbers):
            buffer = lottery + self.salt + alphabet
            alphabet = self.consistent_shuffle(alphabet, buffer[:len(alphabet)])
            last = self.hash_number(number, alphabet)
            ret += last
            
            if i + 1 < len(numbers):
                number %= (ord(last) + i)
                seps_index = number % len(self.seps)
                ret += self.seps[seps_index]

        if len(ret) < self.min_length:
            guard_index = (numbers_hash_int + ord(ret[0])) % len(self.guards)
            guard = self.guards[guard_index]
            ret = guard + ret
            
            if len(ret) < self.min_length:
                guard_index = (numbers_hash_int + ord(ret[2])) % len(self.guards)
                guard = self.guards[guard_index]
                ret += guard

        half_length = len(alphabet) // 2
        while len(ret) < self.min_length:
            alphabet = self.consistent_shuffle(alphabet, alphabet)
            ret = alphabet[half_length:] + ret + alphabet[:half_length]
            excess = len(ret) - self.min_length
            if excess > 0:
                ret = ret[excess // 2 : excess // 2 + self.min_length]

        return ret

    def hash_number(self, number, alphabet):
        hash_str = ""
        len_alphabet = len(alphabet)
        while True:
            hash_str = alphabet[number % len_alphabet] + hash_str
            number //= len_alphabet
            if number <= 0:
                break
        return hash_str

# === 設定參數 ===
salt = "housemate-haha-deep-link-salt-2026"
min_length = 8
target_number = 156842

# === 執行 ===
hasher = SimpleHashids(salt=salt, min_length=min_length)
result = hasher.hash(target_number)

print(f"ID: {target_number}")
print(f"Hash: {result}")