import Types "/Types/types";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";

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
};
