import Types "/Types/types";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Time "mo:base/Time";

actor CertifyBackend {
    // STATE
    // private stable var certificateEntries : [(Types.CertificateId, Types.Certificate)] = [];
    private stable var userEntries : [(Types.UserId, Types.User)] = [];
    private stable var membershipEntries : [(Text, Types.IssuerMember)] = [];

    // private var certificates = HashMap.fromIter<Types.CertificateId, Types.Certificate>(
    //     certificateEntries.vals(), certificateEntries.size(), Text.equal, Text.hash
    // );

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
};
