import Types "/Types/types";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";

actor CertifyBackend {
    // STATE
    private stable var certificateEntries : [(Types.CertificateId, Types.Certificate)] = [];
    private stable var userEntries : [(Types.UserId, Types.User)] = [];
    private stable var membershipEntries : [(Text, Types.IssuerMember)] = [];

    private var certificates = HashMap.fromIter<Types.CertificateId, Types.Certificate>(
        certificateEntries.vals(), certificateEntries.size(), Text.equal, Text.hash
    );

    private var users = HashMap.fromIter<Types.UserId, Types.User>(
        userEntries.vals(), userEntries.size(), Principal.equal, Principal.hash
    );
    
    private var memberships = HashMap.fromIter<Text, Types.IssuerMember>(
        membershipEntries.vals(), membershipEntries.size(), Text.equal, Text.hash
    );

    // HELLO MOTOKO
    public query func greet(name : Text) : async Text {
      return "Hello, " # name # "!";
    };

    // USER MANAGEMENT
    public shared(msg) func registerUser(name: Text, email: Text, role: Types.UserRole) : async Result.Result<Types.User, Text> {
        let userId = msg.caller;
        
        switch (users.get(userId)) {
            case (?_) {
                #err("User already registered")
            };
            case null {
                let user : Types.User = {
                    id = userId;
                    role = role;
                    name = name;
                    email = email;
                    registeredAt = Time.now();
                };
                users.put(userId, user);
                #ok(user)
            };
        }
    };

    public query(msg) func getUser() : async Result.Result<Types.User, Text> {
        let userId = msg.caller;
        switch (users.get(userId)) {
            case (?user) { #ok(user) };
            case null { #err("User not found") };
        }
    };

    // GET ALL USERS
    public query func getAllUsers(): async [Types.User] {
        var userList: [Types.User] = [];
        let entries = users.entries();
        
        for (entry in entries) {
            let (_, user) = entry;  
            userList := Array.append(userList, [user]);  
        };
        
        return userList;
    };

    // Fungsi untuk mendapatkan detail user berdasarkan ID
    public query func getUserById(userId: Types.UserId) : async Result.Result<Types.User, Text> {
        switch (users.get(userId)) {
            case (?user) { #ok(user) };
            case null { #err("User not found") };
        }
    };

    // MEMBERSHIP MANAGEMENT
    public shared(msg) func joinIssuer(issuerId: Types.UserId) : async Result.Result<Text, Text> {
        let holderId = msg.caller;
        let membershipKey = Principal.toText(issuerId) # "-" # Principal.toText(holderId);
        
        switch (users.get(holderId)) {
            case null { #err("Holder not registered") };
            case (?_) {
                switch (users.get(issuerId)) {
                    case null { #err("Issuer not found") };
                    case (?issuer) {
                        if (issuer.role != #Issuer) {
                            #err("Target user is not an issuer")
                        } else {
                            let membership : Types.IssuerMember = {
                                issuerId = issuerId;
                                holderId = holderId;
                                joinedAt = Time.now();
                                isActive = true;
                            };
                            memberships.put(membershipKey, membership);
                            #ok("Successfully joined issuer")
                        }
                    };
                }
            };
        }
    };

    // Fungsi untuk mendapatkan semua member dari issuer tertentu
    public query func getMembersByIssuerId(issuerId: Types.UserId) : async Result.Result<[Types.IssuerMember], Text> {
        let buffer = Buffer.Buffer<Types.IssuerMember>(0);
        
        // Iterasi melalui semua issuer members dan filter berdasarkan issuer ID
        for ((key, member) in memberships.entries()) {
            if (Principal.equal(member.issuerId, issuerId)) {
                buffer.add(member);
            };
        };
        
        let results = Buffer.toArray(buffer);
        
        if (results.size() == 0) {
            #err("No members found for this issuer")
        } else {
            #ok(results)
        }
    };

    // Fungsi untuk mendapatkan member aktif dari issuer tertentu
    public query func getActiveMembersByIssuerId(issuerId: Types.UserId) : async Result.Result<[Types.IssuerMember], Text> {
        let buffer = Buffer.Buffer<Types.IssuerMember>(0);
        
        // Filter member yang aktif saja
        for ((key, member) in memberships.entries()) {
            if (Principal.equal(member.issuerId, issuerId) and member.isActive) {
                buffer.add(member);
            };
        };
        
        let results = Buffer.toArray(buffer);
        
        if (results.size() == 0) {
            #err("No active members found for this issuer")
        } else {
            #ok(results)
        }
    };

    // Fungsi untuk menghitung total jumlah member dari issuer tertentu
    public query func getMemberCountByIssuerId(issuerId: Types.UserId) : async Nat {
        var count = 0;
        for ((key, member) in memberships.entries()) {
            if (Principal.equal(member.issuerId, issuerId)) {
                count += 1;
            };
        };
        count
    };

    // Fungsi untuk menghitung jumlah member aktif dari issuer tertentu
    public query func getActiveMemberCountByIssuerId(issuerId: Types.UserId) : async Nat {
        var count = 0;
        for ((key, member) in memberships.entries()) {
            if (Principal.equal(member.issuerId, issuerId) and member.isActive) {
                count += 1;
            };
        };
        count
    };

    // Fungsi untuk mendapatkan semua issuer yang diikuti oleh holder tertentu
    public type MembershipResult = {
        isMember: Bool;
        issuerIds: [Types.UserId];
    };

    // Fungsi untuk mengecek membership dan mendapatkan semua issuer yang diikuti oleh holder
    public query func checkMembershipByHolderId(holderId: Types.UserId) : async MembershipResult {
        let buffer = Buffer.Buffer<Types.UserId>(0);
        
        // Loop melalui semua membership untuk mencari yang sesuai dengan holderId
        for ((key, member) in memberships.entries()) {
            if (Principal.equal(member.holderId, holderId)) {
                buffer.add(member.issuerId);
            };
        };
        
        let issuerIds = Buffer.toArray(buffer);
        let isMember = issuerIds.size() > 0;
        
        {
            isMember = isMember;
            issuerIds = issuerIds;
        }
    };
    
    // GET MEMBERS BY ISSUER ID
    // public shared (msg) func getMemberByIssuer(
    //     issuerId: Principal
    // ) : async Result.Result<[Types.IssuerMember], Text> {
    //     var members : [Types.IssuerMember] = [];

    //     for ()
    // };


    // Certificate Management
    public shared(msg) func issueCertificate(
        holderId: Types.UserId,
        title: Text,
        description: Text,
        ipfsHash: Types.IpfsHash,
        zkProof: Text,
        metadata: Text
    ) : async Result.Result<Types.Certificate, Text> {
        let issuerId = msg.caller;
        
        // Verify issuer role
        switch (users.get(issuerId)) {
            case null { #err("Issuer not registered") };
            case (?issuer) {
                if (issuer.role != #Issuer) {
                    #err("Only issuers can issue certificates")
                } else {
                    // Verify membership
                    let membershipKey = Principal.toText(issuerId) # "-" # Principal.toText(holderId);
                    switch (memberships.get(membershipKey)) {
                        case null { #err("Holder is not a member of this issuer") };
                        case (?membership) {
                            if (not membership.isActive) {
                                #err("Membership is not active")
                            } else {
                                let certificateId = Principal.toText(issuerId) # "-" # Int.toText(Time.now());
                                let certificate : Types.Certificate = {
                                    id = certificateId;
                                    issuer = issuerId;
                                    holder = holderId;
                                    title = title;
                                    description = description;
                                    ipfsHash = ipfsHash;
                                    zkProof = zkProof;
                                    metadata = metadata;
                                    issuedAt = Time.now();
                                    isValid = true;
                                };
                                certificates.put(certificateId, certificate);
                                #ok(certificate)
                            }
                        };
                    }
                }
            };
        }
    };
    
    public query func getCertificate(certificateId: Types.CertificateId) : async Result.Result<Types.Certificate, Text> {
        switch (certificates.get(certificateId)) {
            case (?certificate) { #ok(certificate) };
            case null { #err("Certificate not found") };
        }
    };

    // Fungsi untuk mendapatkan semua sertifikat berdasarkan holder ID
    public query func getCertificatesByHolderId(holderId: Types.UserId) : async Result.Result<[Types.Certificate], Text> {
        let buffer = Buffer.Buffer<Types.Certificate>(0);
        
        // Iterasi melalui semua sertifikat dan filter berdasarkan holder
        for ((id, certificate) in certificates.entries()) {
            if (Principal.equal(certificate.holder, holderId)) {
                buffer.add(certificate);
            };
        };
        
        let results = Buffer.toArray(buffer);
        
        if (results.size() == 0) {
            #err("No certificates found for this holder")
        } else {
            #ok(results)
        }
    };

    // Fungsi untuk mendapatkan semua sertifikat berdasarkan issuer ID
    public query func getCertificatesByIssuerId(issuerId: Types.UserId) : async Result.Result<[Types.Certificate], Text> {
        let buffer = Buffer.Buffer<Types.Certificate>(0);
        
        // Iterasi melalui semua sertifikat dan filter berdasarkan issuer
        for ((id, certificate) in certificates.entries()) {
            if (Principal.equal(certificate.issuer, issuerId)) {
                buffer.add(certificate);
            };
        };
        
        let results = Buffer.toArray(buffer);
        
        if (results.size() == 0) {
            #err("No certificates found for this issuer")
        } else {
            #ok(results)
        }
    };

    // Alternatif: Fungsi untuk mendapatkan sertifikat aktif saja berdasarkan holder ID
    public query func getValidCertificatesByHolderId(holderId: Types.UserId) : async Result.Result<[Types.Certificate], Text> {
        let buffer = Buffer.Buffer<Types.Certificate>(0);
        
        for ((id, certificate) in certificates.entries()) {
            if (Principal.equal(certificate.holder, holderId) and certificate.isValid) {
                buffer.add(certificate);
            };
        };
        
        let results = Buffer.toArray(buffer);
        
        if (results.size() == 0) {
            #err("No valid certificates found for this holder")
        } else {
            #ok(results)
        }
    };

    // Alternatif: Fungsi untuk mendapatkan sertifikat aktif saja berdasarkan issuer ID
    public query func getValidCertificatesByIssuerId(issuerId: Types.UserId) : async Result.Result<[Types.Certificate], Text> {
        let buffer = Buffer.Buffer<Types.Certificate>(0);
        
        for ((id, certificate) in certificates.entries()) {
            if (Principal.equal(certificate.issuer, issuerId) and certificate.isValid) {
                buffer.add(certificate);
            };
        };
        
        let results = Buffer.toArray(buffer);
        
        if (results.size() == 0) {
            #err("No valid certificates found for this issuer")
        } else {
            #ok(results)
        }
    };

    // Fungsi untuk mendapatkan jumlah sertifikat berdasarkan holder ID
    public query func getCertificateCountByHolderId(holderId: Types.UserId) : async Nat {
        var count = 0;
        for ((id, certificate) in certificates.entries()) {
            if (Principal.equal(certificate.holder, holderId)) {
                count += 1;
            };
        };
        count
    };

    // Fungsi untuk mendapatkan jumlah sertifikat berdasarkan issuer ID
    public query func getCertificateCountByIssuerId(issuerId: Types.UserId) : async Nat {
        var count = 0;
        for ((id, certificate) in certificates.entries()) {
            if (Principal.equal(certificate.issuer, issuerId)) {
                count += 1;
            };
        };
        count
    };

    // Fungsi untuk mendapatkan jumlah sertifikat berdasarkan issuer ID
    public query func getUserCountByIssuerId(issuerId: Types.UserId) : async Nat {
        var count = 0;
        for ((id, certificate) in certificates.entries()) {
            if (Principal.equal(certificate.issuer, issuerId)) {
                count += 1;
            };
        };
        count
    };
    
    public query(msg) func getHolderCertificates() : async [Types.Certificate] {
        let holderId = msg.caller;
        let holderCerts = Array.filter<Types.Certificate>(
            Iter.toArray(certificates.vals()),
            func(cert: Types.Certificate) : Bool { cert.holder == holderId }
        );
        holderCerts
    };
    
    public query(msg) func getIssuerCertificates() : async [Types.Certificate] {
        let issuerId = msg.caller;
        let issuerCerts = Array.filter<Types.Certificate>(
            Iter.toArray(certificates.vals()),
            func(cert: Types.Certificate) : Bool { cert.issuer == issuerId }
        );
        issuerCerts
    };

     // GET ALL CERTIFICATES
    public query func getAllCertificates(): async [Types.Certificate] {
        var CertificateList: [Types.Certificate] = [];
        let entries = certificates.entries();
        
        for (entry in entries) {
            let (_, certificate) = entry;  
            CertificateList := Array.append(CertificateList, [certificate]);  
        };
        
        return CertificateList;
    };
    
    // Verification
    public query func verifyCertificate(certificateId: Types.CertificateId, zkProof: Text) : async Result.Result<Bool, Text> {
        switch (certificates.get(certificateId)) {
            case null { #err("Certificate not found") };
            case (?certificate) {
                if (certificate.zkProof == zkProof and certificate.isValid) {
                    #ok(true)
                } else {
                    #ok(false)
                }
            };
        }
    };
    
    // System upgrade hooks
    system func preupgrade() {
        certificateEntries := Iter.toArray(certificates.entries());
        userEntries := Iter.toArray(users.entries());
        membershipEntries := Iter.toArray(memberships.entries());
    };
    
    system func postupgrade() {
        certificateEntries := [];
        userEntries := [];
        membershipEntries := [];
    };
}
