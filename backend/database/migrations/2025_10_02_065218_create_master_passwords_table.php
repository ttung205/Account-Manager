<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('master_passwords', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('password_hash'); // Argon2id hash của master password
            $table->text('verification_data'); // Encrypted test data để verify
            $table->string('salt'); // Salt cho verification
            $table->timestamp('created_at');
            $table->timestamp('updated_at')->nullable();
            
            // Indexes
            $table->unique('user_id'); // Mỗi user chỉ có 1 master password
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master_passwords');
    }
};
