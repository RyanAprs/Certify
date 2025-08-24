import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Bool "mo:base/Bool";

module {
    public type UserId = Principal;
    public type CertificateId = Text;
    public type IpfsHash = Text;

    public type UserRole = {
        #Issuer;
        #Holder;
        #Verifier;
    };

    public type Certificate = {
        id: CertificateId;
        issuer: UserId;
        holder: UserId;
        title: Text;
        description: Text;
        ipfsHash: IpfsHash;
        zkProof: Text;
        metadata: Text;
        issuedAt: Int;
        isValid: Bool;
    };

    public type User = {
        id: UserId;
        role: UserRole;
        name: Text;
        email: Text;
        registeredAt: Int;
    };
    
    public type IssuerMember = {
        issuerId: UserId;
        holderId: UserId;
        joinedAt: Int;
        isActive: Bool;
    };

}