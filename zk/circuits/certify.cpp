#include "circom.hpp"
#include "calcwit.hpp"
#define NSignals 4
#define NComponents 1
#define NOutputs 1
#define NInputs 2
#define NVars 4
#define NPublic 3
#define __P__ "21888242871839275222246405745257275088548364400416034343698204186575808495617"

/*
Certify
*/
void Certify_57f359d48d404343(Circom_CalcWit *ctx, int __cIdx) {
    FrElement _sigValue[1];
    FrElement _sigValue_1[1];
    FrElement _tmp[1];
    int _secret_sigIdx_;
    int _data_sigIdx_;
    int _hash_sigIdx_;
    _secret_sigIdx_ = ctx->getSignalOffset(__cIdx, 0xab23f0eec020c951LL /* secret */);
    _data_sigIdx_ = ctx->getSignalOffset(__cIdx, 0x855b556730a34a05LL /* data */);
    _hash_sigIdx_ = ctx->getSignalOffset(__cIdx, 0x2e3d9ecc741a7811LL /* hash */);
    /* signal input secret */
    /* signal input data */
    /* signal output hash */
    /* hash <== secret * data */
    ctx->multiGetSignal(__cIdx, __cIdx, _secret_sigIdx_, _sigValue, 1);
    ctx->multiGetSignal(__cIdx, __cIdx, _data_sigIdx_, _sigValue_1, 1);
    Fr_mul(_tmp, _sigValue, _sigValue_1);
    ctx->setSignal(__cIdx, __cIdx, _hash_sigIdx_, _tmp);
    ctx->finished(__cIdx);
}
// Function Table
Circom_ComponentFunction _functionTable[1] = {
     Certify_57f359d48d404343
};
